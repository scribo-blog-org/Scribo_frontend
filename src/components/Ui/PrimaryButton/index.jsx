import "./PrimaryButton.scss";
import Loader from "../Loading";

export default function PrimaryButton({ children, onClick, type = "button", className = "", is_loading = false }) {
  return (
    <button className={`primary_button app-transition ${className} ${is_loading ? 'primary_button_loading' : ''}`} onClick={ is_loading ? () => {} : onClick} type={type}>
      {is_loading && <Loader size={20}/>}
      <p style={{ visibility: is_loading ? 'hidden' : 'visible' }}>
        {children}
      </p>
    </button>
  );
}