import "./ChipButton.scss";

const ChipButton = ({ is_active = false, onClick, children, className }) => {
    return (
        <button type={"button"} className={`chip_button ${is_active ? "chip_button_active" : ""} app-transition ${className ?? ""}`} onClick={onClick}>
            {children}
        </button>
    )
}

export default ChipButton;