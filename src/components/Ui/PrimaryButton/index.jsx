import "./PrimaryButton.scss";
import Loader from "../Loading";

export default function PrimaryButton({ children, onClick, type = "button", className = "", isLoading = false, disabled = false, id }) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      id={id}
      className={`primary_button app-transition app-transition-color ${className} ${isLoading ? "primary_button_loading" : ""} ${isDisabled && !isLoading ? "primary_button_disabled" : ""}`}
      onClick={isDisabled ? undefined : onClick}
      type={type}
      disabled={isDisabled}>
      <Loader size={20}/>
      {children}
    </button>
  );
}
