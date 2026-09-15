import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./DropDown.scss";
import { useOverlayEnter } from "../useOverlayEnter";

import ChevronDownIcon from "../../../assets/svg/chevron-down.svg?react";

const optionLabel = (option) => option?.name ?? option?.label ?? "";

const DropDown = ({
    options = [],
    value,
    onChange,
    placeholder = "Выбрать",
    error = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const listVisible = useOverlayEnter(isOpen);

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value),
        [options, value]
    );

    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                close();
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                close();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [close]);

    const handleSelect = (option) => {
        onChange?.(option.value);
        close();
    };

    return (
        <div
            ref={wrapperRef}
            className={`dropdown ${isOpen ? "dropdown_open" : ""} ${error ? "dropdown_error" : ""} ${className}`.trim()}
        >
            <button
                type="button"
                className="dropdown_select app-transition"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                {selectedOption?.icon ? (
                    <span className="dropdown_icon">{selectedOption.icon}</span>
                ) : null}
                <p className={selectedOption ? "" : "dropdown_select_placeholder"}>
                    {selectedOption ? optionLabel(selectedOption) : placeholder}
                </p>
                <ChevronDownIcon className="dropdown_chevron" />
            </button>

            {isOpen ? (
                <div className={`dropdown_list blurred float_section${listVisible ? " dropdown_list_visible" : ""}`}>
                    {options.map((option) => {
                        const selected = option.value === value;

                        return (
                            <button
                                type="button"
                                key={String(option.value)}
                                className={`dropdown_item app-transition ${selected ? "dropdown_item_selected" : ""}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option.icon ? (
                                    <span className="dropdown_icon">{option.icon}</span>
                                ) : null}
                                <p>{optionLabel(option)}</p>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default DropDown;
