import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AppContext } from "../../App";
import {
    createConversation,
    deleteMessage,
    getConversation,
    getConversations,
    getMessages,
    markConversationRead,
    sendMessage,
} from "../../api/chat.api";
import { socketEvents } from "../../sockets/socket.events";
import { socketService } from "../../sockets/socket.service";
import { format_date_time } from "../../utils/format";
import { scrollTo } from "../../utils/navigation";

import UserBadge from "../../components/UserBadge";
import MessageStatus from "../../components/MessageStatus";
import ActionButton from "../../components/Ui/ActionButton";
import PrimaryButton from "../../components/Ui/PrimaryButton";
import InputField from "../../components/Ui/InputField";
import Loading from "../../components/Ui/Loading";
import { FIELD_LIMITS } from "../../constants/fieldLimits";

import ReplyIcon from "../../assets/svg/reply.svg?react";
import DeleteIcon from "../../assets/svg/delete.svg?react";
import CrossIcon from "../../assets/svg/cross-icon.svg?react";

import "./Messages.scss";

const getQuoteContent = (preview) => {
    const deleted = Boolean(preview?.deleted || preview?.deleted_at);

    return {
        deleted,
        author: preview?.sender?.nick_name || "Пользователь",
        text: deleted ? "Сообщение удалено" : preview?.text || "",
    };
};

const normalizeIncomingMessage = (message, userId) => ({
    ...message,
    is_own: String(message.sender?._id) === String(userId),
});

const propagateDeletedReplyPreview = (list, messageId) =>
    list.map((item) =>
        item.reply_preview?._id === messageId
            ? {
                  ...item,
                  reply_preview: {
                      ...item.reply_preview,
                      deleted: true,
                      text: "",
                  },
              }
            : item,
    );

const mergeMessage = (list, message) => {
    const index = list.findIndex((item) => item._id === message._id);
    let next;

    if (index === -1) {
        next = [...list, message];
    } else {
        next = [...list];
        next[index] = { ...next[index], ...message };
    }

    if (message.deleted_at) {
        return propagateDeletedReplyPreview(next, message._id);
    }

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

            return message.deleted_at
                ? propagateDeletedReplyPreview(next, message._id)
                : next;
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

const MessagesPage = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { profile, showToast } = useContext(AppContext);

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [isListLoading, setIsListLoading] = useState(true);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const listRef = useRef(null);
    const stickToBottomRef = useRef(true);
    const messageMapRef = useRef(new Map());

    const scrollMessagesToBottom = useCallback(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }

        el.scrollTop = el.scrollHeight;
    }, []);

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
        if (!profile) {
            return;
        }

        loadConversations();
    }, [profile, loadConversations]);

    useEffect(() => {
        if (!profile) {
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
        messageMapRef.current = new Map(messages.map((item) => [item._id, item]));
    }, [messages]);

    useEffect(() => {
        if (!conversationId || !profile) {
            setActiveConversation(null);
            setMessages([]);
            return;
        }

        let cancelled = false;

        const loadChat = async () => {
            setIsChatLoading(true);

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
 
                if (message.deleted_at) {
                    setReplyTo((current) =>
                        current?._id === message._id ? null : current,
                    );
                }

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
    }, [conversationId]);

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
        setReplyTo(message);
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
        if (!text || !conversationId || isSending) {
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
                last_message_text: result.data.text,
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

    const activeListItem = useMemo(
        () => conversations.find((item) => item._id === conversationId),
        [conversations, conversationId],
    );

    const participant =
        activeConversation?.participant || activeListItem?.participant;

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
                                        <UserBadge
                                            data={item.participant}
                                            asLink={false}
                                        />
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
                        <>
                            <h1 className="messages_title">Сообщения</h1>
                            <div className="messages_empty_state">
                                <p>Выберите диалог или начните общение из профиля.</p>
                            </div>
                        </>
                    ) : isChatLoading ? (
                        <>
                            <h1 className="messages_title">Сообщения</h1>
                            <Loading size={36} />
                        </>
                    ) : (
                        <>
                            <header className="messages_chat_head">
                                <Link to="/messages" className="messages_back app-transition">
                                    Назад
                                </Link>
                                {participant ? (
                                    <UserBadge data={participant} />
                                ) : (
                                    <h1 className="messages_title">Сообщения</h1>
                                )}
                            </header>

                            <div
                                className="messages_list"
                                ref={listRef}
                                onScroll={handleListScroll}
                            >
                                {messages.map((message) => {
                                    const isOwn = message.is_own;
                                    const isDeleted = Boolean(message.deleted_at);

                                    return (
                                        <article
                                            key={message._id}
                                            id={`message_${message._id}`}
                                            className={`messages_item app-transition${
                                                isOwn ? " messages_item_own" : ""
                                            }`}
                                        >
                                            <div className="messages_bubble">
                                                {message.reply_preview ? (() => {
                                                    const quote = getQuoteContent(
                                                        message.reply_preview,
                                                    );

                                                    if (quote.deleted) {
                                                        return (
                                                            <div
                                                                className="messages_quote messages_quote_deleted app-transition"
                                                            >
                                                                <span className="messages_quote_author">
                                                                    {quote.author}
                                                                </span>
                                                                <span className="messages_quote_text">
                                                                    {quote.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            type="button"
                                                            className="messages_quote app-transition"
                                                            onClick={() =>
                                                                handleReplyPreviewClick(
                                                                    message.reply_preview,
                                                                )
                                                            }
                                                        >
                                                            <span className="messages_quote_author">
                                                                {quote.author}
                                                            </span>
                                                            <span className="messages_quote_text">
                                                                {quote.text}
                                                            </span>
                                                        </button>
                                                    );
                                                })() : null}

                                                <p className={`messages_text${isDeleted ? " messages_text_deleted" : ""}`}>
                                                    {isDeleted
                                                        ? "Сообщение удалено"
                                                        : message.text}
                                                </p>

                                                <div className="messages_meta">
                                                    <span>{format_date_time(message.created_at)}</span>
                                                    {isOwn ? (
                                                        <MessageStatus status={message.status} />
                                                    ) : null}
                                                </div>
                                            </div>

                                            {!isDeleted ? (
                                                <div className="messages_actions">
                                                    <button
                                                        type="button"
                                                        className="messages_action app-transition"
                                                        onClick={() => handleStartReply(message)}
                                                        aria-label="Ответить"
                                                    >
                                                        <ReplyIcon />
                                                    </button>
                                                    {isOwn ? (
                                                        <button
                                                            type="button"
                                                            className="messages_action app-transition"
                                                            onClick={() => handleDelete(message._id)}
                                                            aria-label="Удалить"
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>

                            <form
                                className={`messages_composer${
                                    replyTo ? " messages_composer_replying" : ""
                                }`}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleSend();
                                }}
                            >
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
                                            >
                                                <CrossIcon />
                                            </button>
                                        </div>
                                    );
                                })() : null}
                                <div className="messages_composer_body">
                                    <InputField
                                        isMultiline
                                        multilineRows={2}
                                        length={FIELD_LIMITS.chatMessage.max}
                                        className="messages_composer_input"
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        onKeyDown={handleComposerKeyDown}
                                        placeholder="Сообщение"
                                    />
                                    <PrimaryButton
                                        type="submit"
                                        disabled={!draft.trim()}
                                        isLoading={isSending}
                                    >
                                        Отправить
                                    </PrimaryButton>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
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
