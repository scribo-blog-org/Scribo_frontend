import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AppContext } from "../../App";
import {
    createConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    getConversation,
    getConversations,
    getMessages,
    markConversationRead,
    sendMessage,
} from "../../api/chat.api";
import { socketEvents } from "../../sockets/socket.events";
import { socketService } from "../../sockets/socket.service";
import { format_date_time, format_message_date_label, format_time, is_same_calendar_day } from "../../utils/format";
import { scrollTo } from "../../utils/navigation";

import UserBadge from "../../components/UserBadge";
import UserActivityStatus from "../../components/UserActivityStatus";
import {
    loadOnlineStatusForUsers,
    subscribePresenceChanges,
} from "../../sockets/presence.supabase";
import MessageStatus from "../../components/MessageStatus";
import ActionButton from "../../components/Ui/ActionButton";
import DangerButton from "../../components/Ui/DangerButton";
import PrimaryButton from "../../components/Ui/PrimaryButton";
import RichInputField from "../../components/RichInputField";
import MessageContent from "../../components/MessageContent";
import Loading from "../../components/Ui/Loading";
import { FIELD_LIMITS } from "../../constants/fieldLimits";
import { messagePreviewText, quotePreviewText } from "../../utils/chatMessage";

import ReplyIcon from "../../assets/svg/reply.svg?react";
import DeleteIcon from "../../assets/svg/delete.svg?react";
import EditIcon from "../../assets/svg/edit.svg?react";
import CrossIcon from "../../assets/svg/cross-icon.svg?react";
import ArrowLeftIcon from "../../assets/svg/arrow-left.svg?react";
import NewMessageIllustration from "../../assets/svg/illustrations/new-message.svg?react";

import MessageContextMenu from "./MessageContextMenu";
import { getMessageActions } from "./messageActions";
import "./Messages.scss";

const getQuoteContent = (preview) => {
    const deleted = Boolean(preview?.deleted || preview?.deleted_at);

    return {
        deleted,
        author: preview?.sender?.nick_name || "Пользователь",
        text: deleted ? "Сообщение удалено" : quotePreviewText(preview),
    };
};

const resolveReplyQuote = (message, messageById) => {
    const parentId = message.reply_to || message.reply_preview?._id;
    if (!parentId) {
        return null;
    }

    const parent = messageById.get(String(parentId));
    const source = parent || message.reply_preview;

    if (!source) {
        return null;
    }

    return getQuoteContent(
        parent
            ? {
                  _id: parent._id,
                  text: parent.text,
                  deleted_at: parent.deleted_at,
                  sender: parent.sender,
              }
            : source,
    );
};

const normalizeIncomingMessage = (message, userId) => ({
    ...message,
    is_own: String(message.sender?._id) === String(userId),
});

const mergeMessage = (list, message) => {
    const index = list.findIndex((item) => item._id === message._id);

    if (index === -1) {
        return [...list, message];
    }

    const next = [...list];
    next[index] = { ...next[index], ...message };
    return next;
};

const mergeIncomingMessage = (list, message, profileId) => {
    if (String(message.sender?._id) === String(profileId)) {
        const pendingIndex = list.findIndex(
            (item) =>
                typeof item._id === "string" &&
                item._id.startsWith("pending-") &&
                item.status === "sending" &&
                item.text === message.text &&
                String(item.reply_to || "") === String(message.reply_to || ""),
        );

        if (pendingIndex !== -1) {
            const next = [...list];
            next[pendingIndex] = message;

            return mergeMessage(next, message);
        }
    }

    return mergeMessage(list, message);
};

const sortConversations = (list) =>
    [...list].sort((a, b) => {
        const aTime = a.last_message_at
            ? new Date(a.last_message_at).getTime()
            : 0;
        const bTime = b.last_message_at
            ? new Date(b.last_message_at).getTime()
            : 0;
        return bTime - aTime;
    });

const buildMessageDayGroups = (list) => {
    const groups = [];
    let current = null;

    list.forEach((message, index) => {
        const previous = list[index - 1];

        if (
            !previous ||
            !is_same_calendar_day(previous.created_at, message.created_at)
        ) {
            current = {
                key: `day-${message.created_at}-${index}`,
                label: format_message_date_label(message.created_at),
                messages: [],
            };
            groups.push(current);
        }

        current.messages.push(message);
    });

    return groups;
};

const upsertConversationInList = (list, conversation) => {
    const index = list.findIndex((item) => item._id === conversation._id);
    let next;

    if (index === -1) {
        next = [conversation, ...list];
    } else {
        next = [...list];
        next[index] = { ...next[index], ...conversation };
    }

    return sortConversations(next);
};

const DeleteChatModalActions = ({
    conversationId,
    profile,
    requestCloseModal,
    showToast,
    onDeleted,
    disabled,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!conversationId || isDeleting || disabled) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteConversation(conversationId);

            if (!result?.status) {
                showToast?.({
                    type: "error",
                    message: result?.message || "Не удалось удалить чат",
                });
                return;
            }

            socketEvents.unsubscribeConversation(profile._id, conversationId);
            onDeleted(conversationId);
            showToast?.({
                type: "success",
                message: "Чат удалён",
            });
            requestCloseModal();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="modal_delete_post_content_bottom">
            <ActionButton
                type="button"
                disabled={isDeleting}
                onClick={requestCloseModal}
                className="modal_delete_post_content_button"
            >
                Отмена
            </ActionButton>
            <DangerButton
                type="button"
                isActive
                isLoading={isDeleting}
                disabled={disabled || isDeleting}
                onClick={handleDelete}
                className="modal_delete_post_content_button"
            >
                Удалить
            </DangerButton>
        </div>
    );
};

const getDeleteChatModalContent = ({
    participant,
    conversationId,
    profile,
    requestCloseModal,
    showToast,
    onDeleted,
    disabled,
}) => (
    <div className="messages_delete_modal">
        <p className="messages_delete_modal_text">
            Диалог с {participant?.nick_name || "пользователем"} и все сообщения
            будут удалены безвозвратно. Это действие нельзя отменить.
        </p>
        <DeleteChatModalActions
            conversationId={conversationId}
            profile={profile}
            requestCloseModal={requestCloseModal}
            showToast={showToast}
            onDeleted={onDeleted}
            disabled={disabled}
        />
    </div>
);

const MessagesPage = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { profile, showToast, showModalWindow, requestCloseModal } =
        useContext(AppContext);

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isListLoading, setIsListLoading] = useState(true);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageMenu, setMessageMenu] = useState(null);
    const [onlineByUserId, setOnlineByUserId] = useState({});

    const listRef = useRef(null);
    const composerInputRef = useRef(null);
    const stickToBottomRef = useRef(true);

    const scrollMessagesToBottom = useCallback(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }

        el.scrollTop = el.scrollHeight;
    }, []);

    const scrollIfPinned = useCallback(() => {
        if (!stickToBottomRef.current) {
            return;
        }

        requestAnimationFrame(() => {
            scrollMessagesToBottom();
            requestAnimationFrame(scrollMessagesToBottom);
        });
    }, [scrollMessagesToBottom]);

    const handleListScroll = () => {
        const el = listRef.current;
        if (!el) {
            return;
        }

        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        stickToBottomRef.current = distance < 80;
    };

    const upsertMessage = useCallback((message) => {
        if (!profile) {
            return;
        }

        const normalized = normalizeIncomingMessage(message, profile._id);
        setMessages((current) => mergeMessage(current, normalized));
    }, [profile]);

    const clearConversationUnread = useCallback((id) => {
        setConversations((current) =>
            current.map((item) =>
                item._id === id ? { ...item, unread: 0 } : item,
            ),
        );
    }, []);

    const removeConversationFromState = useCallback((id) => {
        setConversations((current) => current.filter((item) => item._id !== id));

        if (String(conversationId) === String(id)) {
            setActiveConversation(null);
            setMessages([]);
            setDraft("");
            setReplyTo(null);
            setEditingMessage(null);
            navigate("/messages");
        }
    }, [conversationId, navigate]);

    const markChatAsRead = useCallback(async (id) => {
        const result = await markConversationRead(id);
        if (result?.status) {
            clearConversationUnread(id);
        }
        return result;
    }, [clearConversationUnread]);

    const loadConversations = useCallback(async (silent = false) => {
        if (!silent) {
            setIsListLoading(true);
        }

        const result = await getConversations();
        if (result?.status) {
            setConversations(result.data || []);
        } else if (!silent) {
            showToast?.({
                type: "error",
                message: result?.message || "Не удалось загрузить диалоги",
            });
        }

        if (!silent) {
            setIsListLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!profile?._id) {
            return;
        }

        loadConversations();
    }, [profile?._id, loadConversations]);

    useEffect(() => {
        if (!profile?._id) {
            return;
        }

        const unsubscribe = socketService.on("chat:conversation", (conversation) => {
            setConversations((current) =>
                upsertConversationInList(current, conversation),
            );
        });

        return unsubscribe;
    }, [profile?._id]);

    useEffect(() => {
        if (!profile) {
            return;
        }

        const unsubscribe = socketService.on(
            "chat:conversation-deleted",
            (deletedConversationId) => {
                if (profile?._id && deletedConversationId) {
                    socketEvents.unsubscribeConversation(
                        profile._id,
                        deletedConversationId,
                    );
                }

                removeConversationFromState(deletedConversationId);
            },
        );

        return unsubscribe;
    }, [profile, removeConversationFromState]);

    useEffect(() => {
        if (!conversationId || !profile) {
            setActiveConversation(null);
            setMessages([]);
            setDraft("");
            setReplyTo(null);
            setEditingMessage(null);
            return;
        }

        let cancelled = false;

        const loadChat = async () => {
            setIsChatLoading(true);
            setDraft("");
            setReplyTo(null);
            setEditingMessage(null);

            const [conversationResult, messagesResult] = await Promise.all([
                getConversation(conversationId),
                getMessages(conversationId),
            ]);

            if (cancelled) {
                return;
            }

            if (!conversationResult?.status) {
                showToast?.({
                    type: "error",
                    message: conversationResult?.message || "Диалог не найден",
                });
                navigate("/messages");
                setIsChatLoading(false);
                return;
            }

            stickToBottomRef.current = true;
            setActiveConversation(conversationResult.data);
            setMessages(messagesResult?.data?.items || []);
            clearConversationUnread(conversationId);
            await markChatAsRead(conversationId);
            setIsChatLoading(false);
        };

        loadChat();

        socketEvents.subscribeConversation(profile._id, conversationId, {
            onMessage: (message) => {
                const normalized = normalizeIncomingMessage(message, profile._id);
                setMessages((current) =>
                    mergeIncomingMessage(current, normalized, profile._id),
                );
 
                setReplyTo((current) => {
                    if (!current || String(current._id) !== String(message._id)) {
                        return current;
                    }

                    if (message.deleted_at) {
                        return null;
                    }

                    return {
                        ...current,
                        text: message.text,
                        edited_at: message.edited_at || null,
                    };
                });

                if (
                    !message.deleted_at &&
                    String(message.sender?._id) !== String(profile._id)
                ) {
                    markChatAsRead(conversationId);
                }
            },
            onRead: (payload) => {
                if (!payload?.user_id || String(payload.user_id) === String(profile._id)) {
                    return;
                }

                setMessages((current) =>
                    current.map((item) =>
                        item.is_own ? { ...item, status: "read" } : item,
                    ),
                );
            },
        });

        return () => {
            cancelled = true;
            socketEvents.unsubscribeConversation(profile._id, conversationId);
        };
    }, [
        conversationId,
        profile,
        navigate,
        showToast,
        markChatAsRead,
        clearConversationUnread,
    ]);

    useEffect(() => {
        stickToBottomRef.current = true;
        setMessageMenu(null);
    }, [conversationId]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }

        const closeMenu = () => setMessageMenu(null);
        el.addEventListener("scroll", closeMenu, { passive: true });

        return () => el.removeEventListener("scroll", closeMenu);
    }, [conversationId]);

    const openMessageMenu = (event, items) => {
        if (!items.length) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        setMessageMenu({
            x: event.clientX,
            y: event.clientY,
            items,
        });
    };

    useEffect(() => {
        if (isChatLoading) {
            return;
        }

        if (!stickToBottomRef.current) {
            return;
        }

        scrollMessagesToBottom();
    }, [messages, isChatLoading, scrollMessagesToBottom]);

    const handleStartReply = (message) => {
        setEditingMessage(null);
        setReplyTo(message);
    };

    const scrollToMessageDay = useCallback((groupKey) => {
        document.getElementById(`messages_day_${groupKey}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, []);

    useEffect(() => {
        if (!replyTo || isChatLoading) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            composerInputRef.current?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [replyTo, isChatLoading]);

    const handleMessageDoubleClick = (event, message) => {
        if (!message || message.deleted_at || isChatLoading) {
            return;
        }

        if (
            event.target.closest(
                "a, button, input, textarea, [contenteditable='true']",
            )
        ) {
            return;
        }

        handleStartReply(message);
    };

    const handleStartEdit = (message) => {
        setReplyTo(null);
        setEditingMessage(message);
        setDraft(message.text || "");
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setDraft("");
    };

    const handleReplyPreviewClick = (preview) => {
        if (!preview || preview.deleted) {
            return;
        }

        scrollTo(`message_${preview._id}`, "center");
        const element = document.getElementById(`message_${preview._id}`);
        element?.classList.add("messages_item_highlight");
        setTimeout(() => {
            element?.classList.remove("messages_item_highlight");
        }, 1600);
    };

    const handleSend = async () => {
        const text = draft.trim();
        if (!text || !conversationId || isSending || isChatLoading) {
            return;
        }

        if (editingMessage) {
            setIsSending(true);
            const result = await editMessage(editingMessage._id, { text });
            setIsSending(false);

            if (!result?.status) {
                showToast?.({
                    type: "error",
                    message: result?.message || "Не удалось изменить сообщение",
                });
                return;
            }

            upsertMessage(result.data);
            setEditingMessage(null);
            setDraft("");
            setConversations((current) => {
                const existing = current.find((item) => item._id === conversationId);
                if (!existing) {
                    return current;
                }

                return upsertConversationInList(current, {
                    ...existing,
                    last_message_text: messagePreviewText(result.data),
                    last_message_at: result.data.created_at,
                });
            });
            return;
        }

        const pendingId = `pending-${crypto.randomUUID()}`;
        const optimistic = {
            _id: pendingId,
            conversation_id: conversationId,
            sender: {
                _id: profile._id,
                nick_name: profile.nick_name,
                avatar: profile.avatar,
            },
            text,
            reply_to: replyTo?._id || null,
            reply_preview: replyTo
                ? {
                      _id: replyTo._id,
                      text: replyTo.deleted_at ? "" : replyTo.text,
                      deleted: Boolean(replyTo.deleted_at),
                      sender: replyTo.sender,
                  }
                : null,
            deleted_at: null,
            created_at: new Date().toISOString(),
            is_own: true,
            status: "sending",
        };

        stickToBottomRef.current = true;
        setMessages((current) => [...current, optimistic]);
        setDraft("");
        setReplyTo(null);
        setIsSending(true);

        const result = await sendMessage(conversationId, {
            text,
            replyTo: replyTo?._id,
        });

        setIsSending(false);

        if (!result?.status) {
            setMessages((current) => current.filter((item) => item._id !== pendingId));
            showToast?.({
                type: "error",
                message: result?.message || "Не удалось отправить сообщение",
            });
            return;
        }

        setMessages((current) => {
            const filtered = current.filter((item) => item._id !== pendingId);
            const exists = filtered.some((item) => item._id === result.data._id);

            if (exists) {
                return filtered.map((item) =>
                    item._id === result.data._id
                        ? { ...item, ...result.data, status: "sent" }
                        : item,
                );
            }

            return [...filtered, { ...result.data, status: "sent" }];
        });

        setConversations((current) => {
            const existing = current.find((item) => item._id === conversationId);
            if (!existing) {
                return current;
            }

            return upsertConversationInList(current, {
                ...existing,
                last_message_text: messagePreviewText(result.data),
                last_message_at: result.data.created_at,
                unread: 0,
            });
        });
    };

    const handleComposerKeyDown = (event) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
        }

        event.preventDefault();
        handleSend();
    };

    const handleDelete = async (messageId) => {
        const result = await deleteMessage(messageId);
        if (!result?.status) {
            showToast?.({
                type: "error",
                message: result?.message || "Не удалось удалить сообщение",
            });
            return;
        }

        upsertMessage(result.data);
        setReplyTo((current) => (current?._id === messageId ? null : current));
    };

    const messageActionHandlers = {
        onReply: handleStartReply,
        onEdit: handleStartEdit,
        onDelete: handleDelete,
        icons: {
            reply: ReplyIcon,
            edit: EditIcon,
            delete: DeleteIcon,
        },
    };

    const activeListItem = useMemo(
        () => conversations.find((item) => item._id === conversationId),
        [conversations, conversationId],
    );

    const participant =
        activeConversation?.participant || activeListItem?.participant;

    const watchedUserIds = useMemo(() => {
        const ids = conversations
            .map((item) => item.participant?._id)
            .filter(Boolean)
            .map(String);

        if (participant?._id) {
            ids.push(String(participant._id));
        }

        return [...new Set(ids)];
    }, [conversations, participant?._id]);

    useEffect(() => {
        if (!watchedUserIds.length) {
            return;
        }

        let cancelled = false;

        void loadOnlineStatusForUsers(watchedUserIds).then((statusMap) => {
            if (!cancelled) {
                setOnlineByUserId(statusMap);
            }
        });

        const unsubscribe = subscribePresenceChanges((userId, online) => {
            if (!cancelled) {
                setOnlineByUserId((current) => ({
                    ...current,
                    [userId]: online,
                }));
            }
        });

        return () => {
            cancelled = true;
            void unsubscribe();
        };
    }, [watchedUserIds]);

    const messageDayGroups = useMemo(
        () => buildMessageDayGroups(messages),
        [messages],
    );

    const messageById = useMemo(
        () => new Map(messages.map((item) => [String(item._id), item])),
        [messages],
    );

    const openDeleteChatModal = useCallback(() => {
        if (!conversationId || !profile) {
            return;
        }

        showModalWindow({
            title: "Удалить чат?",
            size: "small",
            showCloseButton: false,
            closeFunc: () => {},
            content: getDeleteChatModalContent({
                participant,
                conversationId,
                profile,
                requestCloseModal,
                showToast,
                onDeleted: removeConversationFromState,
                disabled: isChatLoading,
            }),
        });
    }, [
        conversationId,
        profile,
        participant,
        showModalWindow,
        requestCloseModal,
        showToast,
        removeConversationFromState,
        isChatLoading,
    ]);

    if (!profile) {
        return (
            <div className="messages_page">
                <h1 className="messages_title">Сообщения</h1>
                <div className="messages_empty_state">
                    <p>Войдите, чтобы открыть сообщения.</p>
                    <ActionButton onClick={() => navigate("/auth/login")}>
                        Войти
                    </ActionButton>
                </div>
            </div>
        );
    }

    return (
        <div className="messages_page">
            <div className={`messages_layout${conversationId ? " messages_layout_chat" : ""}`}>
                <aside className="messages_sidebar">
                    {isListLoading ? (
                        <Loading size={32} />
                    ) : conversations.length ? (
                        <ul className="messages_conversation_list">
                            {conversations.map((item) => (
                                <li key={item._id}>
                                    <Link
                                        to={`/messages/${item._id}`}
                                        className={`messages_conversation_item app-transition${
                                            item._id === conversationId
                                                ? " messages_conversation_item_active"
                                                : ""
                                        }`}
                                    >
                                        <div className="messages_conversation_data">
                                            <UserBadge
                                                data={item.participant}
                                                asLink={false}
                                            />
                                            <UserActivityStatus
                                                user={item.participant}
                                                viewerId={profile._id}
                                                isOnline={onlineByUserId[String(item.participant?._id)] ?? false}
                                                className="messages_activity_status"
                                            />
                                        </div>
                                        <div className="messages_conversation_copy">
                                            <p className="messages_conversation_preview">
                                                {item.last_message_text || "Нет сообщений"}
                                            </p>
                                            <div className="messages_conversation_row">
                                                {item.last_message_at ? (
                                                    <span className="messages_conversation_time">
                                                        {format_date_time(item.last_message_at)}
                                                    </span>
                                                ) : null}
                                                {item.unread > 0 ? (
                                                    <span className="messages_conversation_unread">
                                                        {item.unread}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="messages_empty_hint">
                            Пока нет диалогов. Начните общение из профиля пользователя.
                        </p>
                    )}
                </aside>

                <section className="messages_chat">
                    {!conversationId ? (
                        <div className="messages_blank">
                            <div className="messages_blank_sheet" aria-hidden="true">
                                
                                <NewMessageIllustration className="app-transition-color"/>
                            </div>
                            <div className="messages_blank_copy">
                                <h1>Диалог ещё пустой</h1>
                                <p className="messages_blank_lead">
                                    Выберите чат слева. Или откройте профиль и нажмите
                                    «Начать общение».
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <header className="messages_chat_head">
                                <ActionButton
                                    className="messages_back"
                                    onClick={() => navigate("/messages")}
                                >
                                    <ArrowLeftIcon className="app-transition" />
                                    Назад
                                </ActionButton>
                                <div className="messages_chat_head_row">
                                    {participant ? (
                                        <div className="messages_chat_head_user">
                                            <UserBadge data={participant} />
                                            <UserActivityStatus
                                                user={participant}
                                                viewerId={profile._id}
                                                isOnline={onlineByUserId[String(participant._id)] ?? false}
                                                className="messages_activity_status"
                                            />
                                        </div>
                                    ) : (
                                        <h1 className="messages_title">Сообщения</h1>
                                    )}
                                    <ActionButton
                                        type="button"
                                        disabled={isChatLoading}
                                        onClick={openDeleteChatModal}
                                    >
                                        Удалить чат
                                    </ActionButton>
                                </div>
                            </header>

                            <div
                                className="messages_list"
                                ref={listRef}
                                onScroll={handleListScroll}
                            >
                                {isChatLoading ? (
                                    <div className="messages_list_loader">
                                        <Loading size={36} />
                                    </div>
                                ) : (
                                    messageDayGroups.map((group, groupIndex) => (
                                        <section
                                            key={group.key}
                                            id={`messages_day_${group.key}`}
                                            className="messages_day_group"
                                        >
                                            <div
                                                className="messages_date_divider"
                                                style={{
                                                    zIndex:
                                                        messageDayGroups.length -
                                                        groupIndex,
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className="messages_date_label app-transition"
                                                    onClick={() =>
                                                        scrollToMessageDay(group.key)
                                                    }
                                                >
                                                    {group.label}
                                                </button>
                                            </div>

                                            {group.messages.map((message) => {
                                    const isOwn = message.is_own;
                                    const isDeleted = Boolean(message.deleted_at);
                                    const hasEmbeds =
                                        !isDeleted &&
                                        /https?:\/\//.test(message.text || "");
                                    const replyQuote = resolveReplyQuote(message, messageById);
                                    const replyTargetId =
                                        message.reply_to || message.reply_preview?._id;

                                    const actionItems = getMessageActions({
                                        message,
                                        isOwn,
                                        isChatLoading,
                                        editingMessage,
                                        handlers: messageActionHandlers,
                                    });

                                    return (
                                        <article
                                            key={message._id}
                                            id={`message_${message._id}`}
                                            className={`messages_item app-transition${
                                                isOwn ? " messages_item_own" : ""
                                            }`}
                                            onDoubleClick={(event) =>
                                                handleMessageDoubleClick(event, message)
                                            }
                                            onContextMenu={(event) =>
                                                openMessageMenu(event, actionItems)
                                            }
                                        >
                                            <div className="messages_bubble_wrap">
                                                <div className="messages_bubble">
                                                {replyQuote ? (() => {
                                                    if (replyQuote.deleted) {
                                                        return (
                                                            <div
                                                                className="messages_quote messages_quote_deleted app-transition"
                                                            >
                                                                <span className="messages_quote_author">
                                                                    {replyQuote.author}
                                                                </span>
                                                                <span className="messages_quote_text">
                                                                    {replyQuote.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            type="button"
                                                            className="messages_quote app-transition"
                                                            onClick={() =>
                                                                handleReplyPreviewClick({
                                                                    _id: replyTargetId,
                                                                    deleted: replyQuote.deleted,
                                                                })
                                                            }
                                                        >
                                                            <span className="messages_quote_author">
                                                                {replyQuote.author}
                                                            </span>
                                                            <span className="messages_quote_text">
                                                                {replyQuote.text}
                                                            </span>
                                                        </button>
                                                    );
                                                })() : null}

                                                <div
                                                    className={`messages_body${
                                                        hasEmbeds ? " messages_body_with_post" : ""
                                                    }`}
                                                >
                                                    <MessageContent
                                                        text={message.text}
                                                        className="messages_text"
                                                        deleted={isDeleted}
                                                        onLayoutChange={scrollIfPinned}
                                                    />

                                                    <div className="messages_meta">
                                                        <span className="messages_time">
                                                            {format_time(message.created_at)}
                                                        </span>
                                                        {message.edited_at ? (
                                                            <span className="messages_edited">
                                                                изменено
                                                            </span>
                                                        ) : null}
                                                        {isOwn ? (
                                                            <MessageStatus status={message.status} />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                    );
                                            })}
                                        </section>
                                    ))
                                )}
                            </div>

                            <form
                                className={`messages_composer${
                                    replyTo ? " messages_composer_replying" : ""
                                }${
                                    editingMessage ? " messages_composer_editing" : ""
                                }${isChatLoading ? " messages_composer_loading" : ""}`}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleSend();
                                }}
                            >
                                {editingMessage ? (
                                    <div className="messages_composer_edit app-transition">
                                        <span className="messages_composer_edit_label">
                                            Редактирование
                                        </span>
                                        <button
                                            type="button"
                                            className="messages_composer_reply_close app-transition"
                                            onClick={handleCancelEdit}
                                            aria-label="Отменить редактирование"
                                            disabled={isChatLoading}
                                        >
                                            <CrossIcon />
                                        </button>
                                    </div>
                                ) : null}
                                {replyTo ? (() => {
                                    const quote = getQuoteContent(replyTo);

                                    return (
                                        <div className="messages_composer_reply app-transition">
                                            <ReplyIcon
                                                className="messages_composer_reply_icon"
                                                aria-hidden
                                            />
                                            <div
                                                className={`messages_composer_reply_quote${
                                                    quote.deleted
                                                        ? " messages_composer_reply_quote_deleted"
                                                        : ""
                                                }`}
                                            >
                                                <span className="messages_quote_author">
                                                    {quote.author}
                                                </span>
                                                <span className="messages_quote_text">
                                                    {quote.text}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="messages_composer_reply_close app-transition"
                                                onClick={() => setReplyTo(null)}
                                                aria-label="Отменить ответ"
                                                disabled={isChatLoading}
                                            >
                                                <CrossIcon />
                                            </button>
                                        </div>
                                    );
                                })() : null}
                                <div className="messages_composer_body">
                                    <RichInputField
                                        preset="social"
                                        isMultiline
                                        multilineRows={2}
                                        length={FIELD_LIMITS.chatMessage.max}
                                        className="messages_composer_input"
                                        inputRef={composerInputRef}
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        onKeyDown={handleComposerKeyDown}
                                        placeholder="Сообщение"
                                        blocked={isChatLoading}
                                    />
                                    <PrimaryButton
                                        type="submit"
                                        disabled={!draft.trim() || isChatLoading}
                                        isLoading={isSending}
                                    >
                                        {editingMessage ? "Сохранить" : "Отправить"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
            {messageMenu ? (
                <MessageContextMenu
                    x={messageMenu.x}
                    y={messageMenu.y}
                    items={messageMenu.items}
                    onClose={() => setMessageMenu(null)}
                />
            ) : null}
        </div>
    );
};

export const startConversationWithUser = async (userId, navigate, showToast) => {
    const result = await createConversation(userId);

    if (!result?.status) {
        showToast?.({
            type: "error",
            message: result?.message || "Не удалось создать диалог",
        });
        return;
    }

    navigate(`/messages/${result.data._id}`);
};

export default MessagesPage;
