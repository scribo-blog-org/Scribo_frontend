import "./PrimaryButton.scss";

export default function PrimaryButton({ children, onClick, type = "button", className = "" }) {
  return (
    <button className={`primary_button app-transition ${className}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
}