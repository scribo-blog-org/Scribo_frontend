import "./ActionButton.scss";

export default function ActionButton({ children, onClick, type = "button", className = "" }) {
  return (
    <button className={`action_button app-transition ${className}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
}