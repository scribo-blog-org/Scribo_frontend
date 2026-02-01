import("./Popup.scss");

const Popup = ({ child }) => {
    return (
        <div className="popup app-transition">{child}</div>
    )
}


export default Popup;