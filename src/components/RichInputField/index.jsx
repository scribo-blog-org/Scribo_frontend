import { FloatingPortal } from "@floating-ui/react";

import InputField from "../Ui/InputField";
import { useRichInputField } from "../../hooks/useRichInputField";

import "../Ui/InputField/InputField.scss";
import "../Ui/Flyout/Flyout.scss";
import "./RichInputField.scss";

const PORTAL_ROOT = "app-layout";

const RichInputField = ({
    value,
    onChange,
    preset = "social",
    features,
    onMouseDown,
    placeholder,
    length = 2000,
    className = "",
    multilineRows = 3,
    error,
    blocked,
    disabled,
    onFocus,
    onKeyDown,
    isMultiline: _isMultiline,
    ...props
}) => {
    const {
        anchorRef,
        textareaRef,
        mirrorRef,
        mirrorHtml,
        syncScroll,
        refs,
        floatingStyles,
        text,
        items,
        suggestKind,
        activeIndex,
        resolvedFeatures,
        refreshSuggest,
        handleChange,
        handleKeyDown,
        dismissSuggest,
        applySelection,
        suggestOpen,
    } = useRichInputField({
        value,
        onChange,
        preset,
        features,
    });

    if (!resolvedFeatures.hashtags && !resolvedFeatures.mentions) {
        return (
            <InputField
                value={value}
                onChange={onChange}
                onMouseDown={onMouseDown}
                placeholder={placeholder}
                length={length}
                className={className}
                isMultiline
                multilineRows={multilineRows}
                error={error}
                blocked={blocked}
                disabled={disabled}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                {...props}
            />
        );
    }

    const portalRoot =
        typeof document === "undefined" ? null : document.getElementById(PORTAL_ROOT);

    const isBlocked = blocked || disabled;

    return (
        <div
            className={`rich_input_field input_field_wrapper${
                isBlocked ? " input_field_wrapper_blocked" : ""
            }`}
            ref={(node) => {
                anchorRef.current = node;
                refs.setReference(node);
            }}
        >
            <div
                ref={mirrorRef}
                className={`rich_input_field_mirror input_field ${className}`.trim()}
                aria-hidden="true"
                dangerouslySetInnerHTML={{
                    __html: mirrorHtml + (text?.endsWith("\n") ? "<br>" : ""),
                }}
            />
            <textarea
                ref={textareaRef}
                className={`input_field rich_input_field_input app-transition ${className}${
                    error ? " incorrect_field" : ""
                }${isBlocked ? " input_field_blocked" : ""}`}
                value={text}
                rows={multilineRows}
                wrap="soft"
                maxLength={length}
                placeholder={placeholder}
                disabled={isBlocked}
                aria-disabled={isBlocked}
                onMouseDown={onMouseDown}
                onScroll={syncScroll}
                onFocus={(event) => {
                    refreshSuggest();
                    onFocus?.(event);
                }}
                onSelect={refreshSuggest}
                onClick={refreshSuggest}
                onKeyUp={refreshSuggest}
                onChange={(event) => {
                    handleChange(event);
                    syncScroll();
                }}
                onKeyDown={(event) => {
                    handleKeyDown(event);
                    if (!event.defaultPrevented) {
                        onKeyDown?.(event);
                    }
                }}
                onBlur={() => {
                    window.setTimeout(() => dismissSuggest(), 160);
                }}
                {...props}
            />
            {suggestOpen ? (
                <FloatingPortal root={portalRoot || undefined}>
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        className="rich_input_field_suggest flyout float_section blurred"
                    >
                        {items.map((item, index) => (
                            <button
                                key={suggestKind === "mention" ? item._id : item}
                                type="button"
                                className={`flyout_item app-transition ${
                                    index === activeIndex ? "flyout_item_active" : ""
                                }`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applySelection(item)}
                            >
                                {suggestKind === "mention" ? `@${item.nick_name}` : item}
                            </button>
                        ))}
                    </div>
                </FloatingPortal>
            ) : null}
        </div>
    );
};

export default RichInputField;
