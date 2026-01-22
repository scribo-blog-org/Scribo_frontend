import "./InputField.scss";
import { forwardRef } from "react";
import { ReactComponent as WarningIcon } from "../../assets/svg/warning-icon.svg";
import { ReactComponent as ConfirmedIcon } from "../../assets/svg/confirmed-icon.svg";

const Input = forwardRef(
(
  {
    className,
    onChange,
    onFocus,
    error,
    type,
    value,
    input_label,
    placeholder,
    required = false,
    confirmed = false,
    is_multiline = false,
    multiline_rows = 1,
    length = 120,
    ...props
  },
  ref
) => {
  
  const InputComponent = is_multiline ? "textarea" : "input";

  return (
    <label className="input_field_label">
      <div className="input">
        <span>{input_label ? input_label + ":" : ""}</span>

        <div className="input_wrapper">
          <InputComponent
            ref={ref} 
            className={`input_field ${error ? "incorrect_field" : ""} app-transition ${className ?? ""} ${confirmed ? "confirmed" : ""}`}
            type={type}
            onChange={onChange}
            onFocus={onFocus}
            required={required}
            placeholder={placeholder}
            rows={multiline_rows}
            wrap="hard"
            maxLength={length}
            value={value}
            readOnly={confirmed}
            {...props}
          />

          {confirmed && (
            <ConfirmedIcon className="inpuut_confirmed_icon app-transition" />
          )}
        </div>
      </div>

      <div className={`input_field_label_error_message ${error ? "show" : ""}`}>
        <WarningIcon className="input_field_label_error_message_logo" />
        <p>{error}</p>
      </div>
    </label>
  );
});

export default Input;
