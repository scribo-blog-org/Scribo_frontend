import "./DropDown.scss"

const { useState } = require('react')

const Dropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="dropdown app-transition">
            <button type='button' className='dropdown_select app-transition' onClick={() => setIsOpen(v => !v)}>
                <p>
                    {selectedOption?.label || 'Выберите вариант'}
                </p>
            </button>

            {isOpen && (
                <div className="dropdown_list app-transition">
                   {options.map((option, index) => (
                        <>
                            <button
                                className={`dropdown_item app-transition ${index === options.length - 1 ? "last_item" : ""} ${option.value === value ? "selected" : ""}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                            }}>
                                <p>{option.label}</p>
                            </button>
                        </>
                    ))}
                </div>
            )}
        </div>
    )
};

export default Dropdown;