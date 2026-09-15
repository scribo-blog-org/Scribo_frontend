import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppContext } from "../../App.jsx";
import { getPublicSupportRequest, replyPublicSupportRequest, updateSupportRequestStatus } from "../../api/support.api";
import { FIELD_LIMITS } from "../../constants/fieldLimits";
import { SUPPORT_STATUSES, kindLabel, statusLabel } from "./constants";
import { format_date_time } from "../../utils/format";

import Field from "../../components/Ui/Field/index";
import InputField from "../../components/Ui/InputField/index";
import PrimaryButton from "../../components/Ui/PrimaryButton";
import ActionButton from "../../components/Ui/ActionButton";
import DropDown from "../../components/Ui/DropDown";
import Loading from "../../components/Ui/Loading";
import UserBadge from "../../components/UserBadge/index";

import ArrowLeftIcon from "../../assets/svg/arrow-left.svg?react";

import "../AdminPanel/Requests.scss";
import "../AdminPanel/RequestDetail.scss";

const canManageSupport = (profile) => ["admin", "tech_admin"].includes(profile?.role);

const SupportRequestPage = () => {
    const { key } = useParams();
    const navigate = useNavigate();
    const { profile, showToast } = useContext(AppContext);
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);
    const [statusSaving, setStatusSaving] = useState(false);

    const isStaff = canManageSupport(profile);
    const canReply = Boolean(item?.can_reply);
    const showStatus = item?.status != null;

    useEffect(() => {
        let cancelled = false;

        const fetchItem = async () => {
            const result = await getPublicSupportRequest(key);

            if (cancelled) {
                return;
            }

            if (!result.status) {
                showToast({ type: "error", message: result.message });
                setItem(null);
                setLoading(false);
                return;
            }

            setItem(result.data);
            setLoading(false);
        };

        fetchItem();

        return () => {
            cancelled = true;
        };
    }, [key, showToast, profile?.role]);

    const handleReply = async () => {
        if (!reply.trim()) {
            setError("Напишите сообщение");
            return;
        }
        if (reply.length > FIELD_LIMITS.supportReply.max) {
            setError(`Сообщение не длиннее ${FIELD_LIMITS.supportReply.max} символов`);
            return;
        }

        setSending(true);
        try {
            const result = await replyPublicSupportRequest(key, reply.trim());

            if (!result.status) {
                showToast({ type: "error", message: result.message || "Не удалось отправить сообщение" });
                if (result?.errors?.body?.replyText?.message) {
                    setError(result.errors.body.replyText.message);
                }
                return;
            }

            setItem(result.data);
            setReply("");
            setError(null);
            showToast({
                type: "success",
                message: isStaff ? "Ответ отправлен" : "Сообщение добавлено"
            });
        }
        catch {
            showToast({ type: "error", message: "Не удалось отправить сообщение" });
        }
        finally {
            setSending(false);
        }
    };

    const handleStatus = async (status) => {
        if (!item?._id || status === item.status || statusSaving) {
            return;
        }

        setStatusSaving(true);
        try {
            const result = await updateSupportRequestStatus(item._id, status);

            if (!result.status) {
                showToast({ type: "error", message: result.message || "Не удалось изменить статус" });
                return;
            }

            setItem(result.data);
            showToast({ type: "success", message: "Статус обновлён" });
        }
        catch {
            showToast({ type: "error", message: "Не удалось изменить статус" });
        }
        finally {
            setStatusSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="support_request_detail">
                <Loading size={40} />
            </div>
        );
    }

    if (!item) {
        navigate("/404")
    }

    return (
        <div className="support_request_detail">
            <div className="support_request_detail_card app-transition">
                <div className="support_request_detail_top">
                    <ActionButton disabled={sending || statusSaving} onClick={() => navigate(isStaff ? "/admin-panel?tab=requests" : item.is_owner ? "/support/mine" : "/support")}>
                        <ArrowLeftIcon />
                        {isStaff ? "К обращениям" : "Поддержка"}
                    </ActionButton>
                    <div className="support_request_detail_tags">
                        {showStatus ? (
                            <span className={`support_status support_status_${item.status}`}>
                                {statusLabel(item.status)}
                            </span>
                        ) : null}
                        <span className="support_kind">{kindLabel(item.kind)}</span>
                    </div>
                </div>
                {isStaff ? <p className="support_request_detail_email">{item.email}</p> : null}
                <p className="support_request_detail_date">{format_date_time(item.created_date)}</p>
                <div className="support_request_detail_message">
                    {item.message}
                </div>
                {isStaff ? (
                    <Field title="Статус">
                        <DropDown
                            options={SUPPORT_STATUSES}
                            value={item.status}
                            onChange={handleStatus}
                        />
                    </Field>
                ) : null}
            </div>

            <div className="support_request_detail_card app-transition">
                <h1 className="kicker">Переписка</h1>
                {
                    item.replies?.length ?
                        <div className="support_request_detail_replies">
                            {item.replies.map((entry) => (
                                <div
                                    key={entry._id}
                                    className={`support_request_detail_reply app-transition ${entry.author_type === "requester" ? "support_request_detail_reply_requester" : ""}`}
                                >
                                    <div className="support_request_detail_reply_head">
                                        {entry.author_type === "staff" && entry.admin ? (
                                            <UserBadge data={entry.admin} />
                                        ) : (
                                            <p className="support_request_detail_reply_author">Автор обращения</p>
                                        )}
                                        <p>{format_date_time(entry.created_date)}</p>
                                    </div>
                                    <p className="support_request_detail_reply_text">{entry.text}</p>
                                </div>
                            ))}
                        </div>
                    :
                        <p className="support_request_detail_empty">Ответов пока нет</p>
                }
                {canReply ? (
                <form
                    className="support_request_detail_form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleReply();
                    }}
                >
                    <Field title={isStaff ? "Ответ" : "Сообщение"} error={error}>
                        <InputField
                            isMultiline={true}
                            multilineRows={6}
                            length={FIELD_LIMITS.supportReply.max}
                            value={reply}
                            placeholder={isStaff ? "Текст ответа" : "Дополните обращение"}
                            onChange={(event) => setReply(event.target.value)}
                            onFocus={() => setError(null)}
                            error={error}
                        />
                    </Field>
                    <PrimaryButton type="submit" isLoading={sending} disabled={statusSaving}>
                        Отправить
                    </PrimaryButton>
                </form>
                ) : (
                    <p className="support_request_detail_empty">
                        {item.closed
                            ? "Обращение рассмотрено, новые ответы закрыты."
                            : "Ответить могут только администраторы. Чтобы писать в переписку, отправьте запрос из аккаунта."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SupportRequestPage;
