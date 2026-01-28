import { useEffect, useState, useRef } from "react";
import "./DropFile.scss";
import { ReactComponent as DeleteIcon } from "../../assets/svg/delete-icon.svg";
import { ReactComponent as WarningIcon } from "../../assets/svg/warning-icon.svg";
import { ReactComponent as UploadFileIcon } from "../../assets/svg/upload-file-icon.svg";

const DropFile = ({
    value,
    preview_url = null,
    setValue,
    background = null,
    drop_file_type,
    errors,
    file_types,
    add_new_errors,
    clear_errors,
    onRemove,
}) => {
    const [preview, setPreview] = useState(null);
    const [isDragged, setDraged] = useState(false);
    const fileRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (value instanceof File) {
            const url = URL.createObjectURL(value);
            setPreview(url);

            return () => URL.revokeObjectURL(url);
        }

        if (preview_url) {
            setPreview(preview_url);
            return;
        }

        setPreview(null);
    }, [value, preview_url]);

    const image_validation = (file) => {
        const errors = [];

        if (
            drop_file_type &&
            drop_file_type.trim() !== "" &&
            !new RegExp(drop_file_type).test(file.type)
        ) {
            errors.push("Incorrect type of file!");
        }

        if (file.size > 4 * 1024 * 1024) {
            errors.push("Max size of image must be 4 mb!");
        }

        return {
            is_valid: errors.length === 0,
            errors,
        };
    };

    const setFileHandler = (e) => {
        const file = e.currentTarget.files[0];
        if (!file) return;

        const validation = image_validation(file);

        if (validation.is_valid) {
            setValue(file);
            clear_errors?.();
        } else {
            add_new_errors?.(validation.errors);
        }
    };

    useEffect(() => {
        if (!fileRef.current) return;

        const el = fileRef.current;

        const handleDragIn = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDraged(true);
        };

        const handleDragOut = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDraged(false);
        };

        const handleDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDraged(false);

            if (e.dataTransfer.files.length > 0) {
                setValue(e.dataTransfer.files[0]);
            }
        };

        el.addEventListener("dragenter", handleDragIn);
        el.addEventListener("dragleave", handleDragOut);
        el.addEventListener("dragover", handleDrag);
        el.addEventListener("drop", handleDrop);

        return () => {
            el.removeEventListener("dragenter", handleDragIn);
            el.removeEventListener("dragleave", handleDragOut);
            el.removeEventListener("dragover", handleDrag);
            el.removeEventListener("drop", handleDrop);
        };
    }, [setValue]);

    return (
        <>
            <div
                ref={fileRef}
                className={`drop_file app-transition${isDragged ? " drop_file_dragged" : ""} ${
                    errors ? "drop_file_incorrect_field" : ""
                }`}
            >
                {value ? (
                    <>
                        {preview && <img src={preview} alt="" />}
                        <div className="remove_image app-transition blurred">
                            <p>{value.name}</p>
                            <button
                                className="remove_image_button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    inputRef.current && (inputRef.current.value = "");
                                    setValue(null);
                                    onRemove?.();
                                }}
                            >
                                <DeleteIcon />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="drop_file_info">
                            {background ?? (
                                <>
                                    <UploadFileIcon className="drop_file_info_upload_icon app-transition" />
                                    <p className="drop_file_info_main_text">
                                        Выберите файл или перетащите его сюда
                                    </p>
                                    <p className="drop_file_info_help_text">{file_types}</p>
                                    <div className="drop_file_info_select app-transition">
                                        Выбрать
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            className="image_input"
                            type="file"
                            accept={drop_file_type}
                            onChange={setFileHandler}
                            ref={inputRef}
                        />
                    </>
                )}
            </div>

            {Array.isArray(errors) && (
                <div className={`drop_file_error_messages ${errors.length ? "show" : ""}`}>
                    {errors.map((error, index) => (
                        <div key={index} className="drop_file_error_message">
                            <WarningIcon className="drop_file_error_message_logo" />
                            <p>{error}</p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default DropFile;
