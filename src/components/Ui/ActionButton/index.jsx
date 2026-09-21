import "./ActionButton.scss";
import Loader from "../Loading";

export default function ActionButton({ children, onClick, type = "button", className = "", disabled = false, isLoading = false }) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      className={`action_button app-transition app-transition-color ${className} ${isLoading ? "action_button_loading" : ""} ${isDisabled && !isLoading ? "action_button_disabled" : ""}`}
      onClick={isDisabled ? undefined : onClick}
      type={type}
      disabled={isDisabled}
    >
      <Loader size={20}/>
      {children}
    </button>
  );
}
