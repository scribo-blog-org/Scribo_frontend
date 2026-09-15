import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../../App";
import { getConversations, sendMessage } from "../../api/chat.api";
import ActionButton from "../Ui/ActionButton";
import PrimaryButton from "../Ui/PrimaryButton";
import Loading from "../Ui/Loading";
import UserBadge from "../UserBadge";
import { absoluteUrl } from "../../seo/site";
import {
    canUseNativeShare,
    copyText,
    sharePostNative,
} from "../../utils/share";

import RedirectIcon from "../../assets/svg/redirect.svg?react";

import "./SharePostModal.scss";

const SharePostModal = ({
    postId,
    postTitle,
    showToast,
    requestCloseModal,
}) => {
    const { profile } = useContext(AppContext);
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(Boolean(profile));
    const [sendingId, setSendingId] = useState(null);
    const shareUrl = absoluteUrl(`/posts/${postId}`);
    const nativeShareAvailable = canUseNativeShare();

    useEffect(() => {
        const field = document.getElementById("share_post_modal_link");
        if (!field) {
            return;
        }

        field.focus();
        field.select();
    }, [shareUrl]);

    useEffect(() => {
        if (!profile) {
            setIsLoadingChats(false);
            return;
        }

        let cancelled = false;

        getConversations().then((result) => {
            if (cancelled) {
                return;
            }

            setConversations(result?.status ? result.data || [] : []);
            setIsLoadingChats(false);
        });

        return () => {
            cancelled = true;
        };
    }, [profile]);

    const handleCopy = async () => {
        try {
            await copyText(shareUrl);
            setCopied(true);
            showToast?.({ message: "Ссылка скопирована", type: "success" });
            window.setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error(error);
            showToast?.({ message: "Не удалось скопировать ссылку", type: "error" });
        }
    };

    const handleNativeShare = async () => {
        try {
            await sharePostNative({ title: postTitle, url: shareUrl });
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }

            console.error(error);
            showToast?.({ message: "Не удалось открыть меню «Поделиться»", type: "error" });
        }
    };

    const handleShareToChat = async (conversationId) => {
        if (!profile || sendingId) {
            return;
        }

        setSendingId(conversationId);

        const result = await sendMessage(conversationId, {
            text: shareUrl,
        });

        setSendingId(null);

        if (!result?.status) {
            showToast?.({
                type: "error",
                message: result?.message || "Не удалось отправить пост",
            });
            return;
        }

        showToast?.({ type: "success", message: "Пост отправлен в чат" });
        requestCloseModal?.();
        navigate(`/messages/${conversationId}`);
    };

    return (
        <div className="share_post_modal">
            <div className="share_post_modal_group">
                <label className="share_post_modal_label" htmlFor="share_post_modal_link">
                    Ссылка на пост
                </label>
                <div className="share_post_modal_link_row">
                    <input
                        id="share_post_modal_link"
                        className="share_post_modal_link input_field app-transition"
                        type="text"
                        readOnly
                        value={shareUrl}
                        onFocus={(event) => event.target.select()}
                        onClick={(event) => event.target.select()}
                    />
                    <PrimaryButton type="button" onClick={handleCopy}>
                        {copied ? "Скопировано" : "Копировать"}
                    </PrimaryButton>
                </div>
            </div>

            <div className="share_post_modal_group">
                <p className="share_post_modal_kicker">Отправить в чат</p>
                {!profile ? (
                    <>
                        <p className="share_post_modal_hint">
                            Войдите, чтобы отправить пост в личные сообщения.
                        </p>
                        <PrimaryButton
                            type="button"
                            className="share_post_modal_login"
                            onClick={() => {
                                requestCloseModal?.();
                                navigate("/auth/login");
                            }}
                        >
                            <RedirectIcon />
                            Войти
                        </PrimaryButton>
                    </>
                ) : isLoadingChats ? (
                    <div className="share_post_modal_loader">
                        <Loading size={24} />
                    </div>
                ) : conversations.length ? (
                    <div className="share_post_modal_chats">
                        {conversations.map((item) => (
                            <button
                                key={item._id}
                                type="button"
                                className="share_post_modal_chat_item app-transition"
                                disabled={Boolean(sendingId)}
                                onClick={() => handleShareToChat(item._id)}
                            >
                                <UserBadge data={item.participant} asLink={false} />
                                {sendingId === item._id ? (
                                    <span className="share_post_modal_chat_status">Отправка…</span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="share_post_modal_hint">
                        Пока нет чатов. Напишите пользователю из профиля — диалог появится здесь.
                    </p>
                )}
            </div>

            {nativeShareAvailable ? (
                <ActionButton
                    type="button"
                    className="share_post_modal_native"
                    onClick={handleNativeShare}
                >
                    Поделиться…
                </ActionButton>
            ) : null}
        </div>
    );
};

export default SharePostModal;
