import "./SwitchBar.scss";

export default function SwitchBar({ active_index, setActiveIndex, items }) {
    return (
        <div className="switcher_bar app-transition">
            {items.map((item, index) => (
                <button
                    key={ index }
                    type="button"
                    className={ `switcher_bar_item app-transition ${ active_index === index ? "switcher_bar_item_active" : "" }` }
                    onClick={ () => setActiveIndex(index) }
                >
                    { item }
                </button>
            ))}
        </div>
    )
}