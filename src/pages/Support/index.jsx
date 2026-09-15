import { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { AppContext } from "../../App";
import { createSupportRequest } from "../../api/support.api";
import { FIELD_LIMITS } from "../../constants/fieldLimits";
import { SUPPORT_KINDS } from "./constants";

import Field from "../../components/Ui/Field/index";
import RichInputField from "../../components/RichInputField";
import DropDown from "../../components/Ui/DropDown";
import PrimaryButton from "../../components/Ui/PrimaryButton";

import "./Support.scss";

const Support = () => {
    const navigate = useNavigate();
    const { showToast, profile, profileLoading } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [fields, setFields] = useState({
        userEmail: "",
        supportKind: "request",
        supportMessage: ""
    });
    const [errors, setErrors] = useState({});

    const handleFocus = (fieldName) => {
        const next = { ...errors };
        delete next[fieldName];
        setErrors(next);
    };

    const validate = () => {
        const next = {};

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.userEmail.trim())) {
            next.userEmail = "Укажите корректную почту";
        }

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
                userEmail: fields.userEmail.trim(),
                supportKind: fields.supportKind,
                supportMessage: fields.supportMessage.trim()
            });

            if (result.status === true && result.data?.access_key) {
                showToast({ message: "Сообщение отправлено. Мы напишем на указанную почту.", type: "success" });
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

    if (!profileLoading && profile) {
        return <Navigate to="/support/mine" replace />;
    }

    return (
        <div className="support_page">
            <div className="support_page_intro">
                <h1>Поддержка</h1>
                <p>Оставьте почту и сообщение. Ответ придёт письмом. Ответить с этой страницы нельзя.</p>
            </div>
            <form
                className="form_input app-transition"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <Field title="Почта" error={errors?.userEmail ?? null}>
                    <InputField
                        type="email"
                        value={fields.userEmail}
                        placeholder="you@example.com"
                        onChange={(event) => setFields({ ...fields, userEmail: event.target.value })}
                        onFocus={() => handleFocus("userEmail")}
                        error={errors?.userEmail ?? null}
                        length={FIELD_LIMITS.email.max}
                    />
                </Field>
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
                        multilineRows={8}
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
                <p className="support_page_note">
                    Если <Link to="/auth/login">войти в аккаунт</Link>, ответы придут на сайте, и вы сможете писать в переписку сами.
                </p>
            </form>
        </div>
    );
};

export default Support;
