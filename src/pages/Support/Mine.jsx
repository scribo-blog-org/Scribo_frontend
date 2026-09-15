import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { AppContext } from "../../App";
import { createSupportRequest, getMySupportRequests } from "../../api/support.api";
import { FIELD_LIMITS } from "../../constants/fieldLimits";
import { SUPPORT_KINDS, kindLabel, statusLabel } from "./constants";
import { format_back, format_date_time } from "../../utils/format";

import Field from "../../components/Ui/Field/index";
import RichInputField from "../../components/RichInputField";
import PrimaryButton from "../../components/Ui/PrimaryButton";
import Pagination from "../../components/Ui/Pagination";
import Loading from "../../components/Ui/Loading";
import Tooltip from "../../components/Ui/Tooltip";

import "./Support.scss";
import "../AdminPanel/Requests.scss";

const SupportMine = () => {
    const navigate = useNavigate();
    const { showToast, profile, profileLoading } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [fields, setFields] = useState({
        supportKind: "request",
        supportMessage: ""
    });
    const [errors, setErrors] = useState({});
    const [items, setItems] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagesCount, setPagesCount] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchMine = async () => {
            const result = await getMySupportRequests({ page, limit: 9 });

            if (cancelled) {
                return;
            }

            if (!result.status) {
                showToast({ type: "error", message: result.message });
                setItems([]);
                setPagesCount(0);
                setListLoading(false);
                return;
            }

            setItems(result.data?.items || []);
            setPagesCount(result.data?.pagination?.pages || 0);
            setListLoading(false);
        };

        if (profile) {
            fetchMine();
        }

        return () => {
            cancelled = true;
        };
    }, [page, profile, showToast]);

    const handleFocus = (fieldName) => {
        const next = { ...errors };
        delete next[fieldName];
        setErrors(next);
    };

    const validate = () => {
        const next = {};

        if (!fields.supportKind) {
            next.supportKind = "Выберите тему";
        }

        if (!fields.supportMessage.trim()) {
            next.supportMessage = "Напишите сообщение";
        } else if (fields.supportMessage.trim().length < FIELD_LIMITS.supportMessage.min) {
            next.supportMessage = `Сообщение не короче ${FIELD_LIMITS.supportMessage.min} символов`;
        } else if (fields.supportMessage.length > FIELD_LIMITS.supportMessage.max) {
            next.supportMessage = `Сообщение не длиннее ${FIELD_LIMITS.supportMessage.max} символов`;
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await createSupportRequest({
                supportKind: fields.supportKind,
                supportMessage: fields.supportMessage.trim()
            });

            if (result.status === true && result.data?.access_key) {
                showToast({ message: "Сообщение отправлено", type: "success" });
                navigate(`/support/${result.data.access_key}`);
                return;
            }

            showToast({ message: result.message || "Не удалось отправить сообщение", type: "error" });

            if (result?.errors?.body) {
                setErrors(
                    Object.fromEntries(
                        Object.entries(result.errors.body).map(([field, obj]) => [field, obj.message])
                    )
                );
            }
        }
        catch {
            showToast({ message: "Не удалось отправить сообщение", type: "error" });
        }
        finally {
            setIsLoading(false);
        }
    };

    if (profileLoading) {
        return <Loading size={40} />;
    }

    if (!profile) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div className="support_page support_page_mine">
            <div className="support_page_intro">
                <h1>Поддержка</h1>
                <p>Обращения с аккаунта. Ответы и статусы приходят в уведомления на сайте.</p>
            </div>
            <form
                className="form_input app-transition"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <Field title="Тема" error={errors?.supportKind ?? null}>
                    <DropDown
                        options={SUPPORT_KINDS}
                        value={fields.supportKind}
                        placeholder="Выберите тему"
                        error={Boolean(errors?.supportKind)}
                        onChange={(value) => {
                            handleFocus("supportKind");
                            setFields({ ...fields, supportKind: value });
                        }}
                    />
                </Field>
                <Field title="Сообщение" error={errors?.supportMessage ?? null}>
                    <RichInputField
                        preset="social"
                        isMultiline={true}
                        multilineRows={6}
                        length={FIELD_LIMITS.supportMessage.max}
                        value={fields.supportMessage}
                        placeholder="Опишите ситуацию"
                        onChange={(event) => setFields({ ...fields, supportMessage: event.target.value })}
                        onFocus={() => handleFocus("supportMessage")}
                        error={errors?.supportMessage ?? null}
                    />
                </Field>
                <PrimaryButton type="submit" isLoading={isLoading}>
                    Отправить
                </PrimaryButton>
            </form>

            <div className="support_page_list">
                <h1 className="kicker">История</h1>
                {listLoading ? (
                    <Loading size={40} />
                ) : (
                    <Pagination
                        content={items}
                        page={page - 1}
                        pagesCount={pagesCount}
                        onPageChange={(index) => setPage(index + 1)}
                    >
                        {(visibleContent) => (
                            visibleContent.length ?
                                visibleContent.map((item) => (
                                    <button
                                        type="button"
                                        key={item._id}
                                        className="admin_panel_content_requests_page_item app-transition"
                                        onClick={() => navigate(`/support/${item.access_key}`)}
                                    >
                                        <div className="admin_panel_content_requests_page_item_meta">
                                            <span className={`support_status support_status_${item.status}`}>
                                                {statusLabel(item.status)}
                                            </span>
                                            <span className="support_kind">{kindLabel(item.kind)}</span>
                                        </div>
                                        <p className="admin_panel_content_requests_page_item_preview">{item.message_preview}</p>
                                        <Tooltip text={format_date_time(item.created_date)}>
                                            <p className="admin_panel_content_requests_page_item_time">
                                                {format_back(item.created_date)}
                                            </p>
                                        </Tooltip>
                                    </button>
                                ))
                            :
                                <p className="admin_panel_content_requests_page_empty">Обращений пока нет</p>
                        )}
                    </Pagination>
                )}
            </div>
        </div>
    );
};

export default SupportMine;
