import "./Toggle.scss"

const Toggle = ({ checked, onChange }) => {
    return (
        <label className="toggle">
            <input type="checkbox" checked={checked ?? false} onChange={(e) => onChange(e.target.checked)}/>
            <span className="track">
                <span className="thumb"></span>
            </span>
        </label>
    )
}

export default Toggle;