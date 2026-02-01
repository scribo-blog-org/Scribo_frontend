import "./DangerButton.scss";

export default function DangerButton({ children, onClick, type = "button", className = "" }) {
  return (
    <button className={`danger_button app-transition ${className}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
}