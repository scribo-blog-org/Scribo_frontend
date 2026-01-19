import React, { useState, useRef } from 'react';
import "./InputField.scss";
import { ReactComponent as WarningIcon } from "../../assets/svg/warning-icon.svg";
import Popup from "../Popup/index";

const Input = ({
  className,
  onChange,
  onFocus,
  error,
  type,
  value: initialValue,
  input_label,
  placeholder,
  required = false,
  is_multiline = false,
  multiline_rows = 1,
  length = 120,
  editable = false
}) => {
  const InputComponent = is_multiline ? 'textarea' : 'input';
  const textareaRef = useRef();

  const [textValue, setTextValue] = useState(initialValue || '');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // История для Ctrl+Z / Ctrl+Y
  const [history, setHistory] = useState([initialValue || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Синхронизация внешнего onChange
  const updateText = (newText, pushToHistory = true) => {
    setTextValue(newText);
    onChange && onChange({ target: { value: newText } });

    if (pushToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, newText]);
      setHistoryIndex(newHistory.length);
    }
  };

  // Выделение текста
  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setSelection({ start, end });
    setShowPopup(start !== end);
  };

  // Добавление ссылки
  const addLink = () => {
    if (!linkUrl) return;
    const before = textValue.slice(0, selection.start);
    const middle = textValue.slice(selection.start, selection.end);
    const after = textValue.slice(selection.end);

    const newText = `${before}[Link url="${linkUrl}"]${middle}[/Link]${after}`;
    updateText(newText);
    setShowPopup(false);
    setLinkUrl('');
  };

  // Добавление жирного текста
  const addBold = () => {
    const before = textValue.slice(0, selection.start);
    const middle = textValue.slice(selection.start, selection.end);
    const after = textValue.slice(selection.end);

    const newText = `${before}[Bold]${middle}[/Bold]${after}`;
    updateText(newText);
    setShowPopup(false);
  };

  // Обработка Ctrl+Z / Ctrl+Y
  const handleKeyDown = (e) => {
    // Undo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTextValue(history[newIndex]);
        onChange && onChange({ target: { value: history[newIndex] } });
      }
    }

    // Redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTextValue(history[newIndex]);
        onChange && onChange({ target: { value: history[newIndex] } });
      }
    }
  };

  return (
    <label className='input_field_label'>
      <div className={"input"}>
        <span>{`${input_label ? input_label + ":" : ''}`}</span>
        <InputComponent
          ref={textareaRef}
          className={`input_field ${error ? "incorrect_field" : ""} app-transition ${className ?? ""}`}
          type={type}
          value={textValue}
          onChange={(e) => updateText(e.target.value)}
          onFocus={(e) => { setShowPopup(false); onFocus && onFocus(e); }}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          required={required}
          placeholder={placeholder}
          rows={multiline_rows}
          wrap="hard"
          maxLength={length}
        />
      </div>

      <div className={`input_field_label_error_message ${error ? "show" : ""}`}>
        <WarningIcon className='input_field_label_error_message_logo' />
        <p>{error}</p>
      </div>

      {showPopup && (
        <Popup child={
          <>
            <button className='app-transition' onClick={addBold}>Bold</button>
            <div className='popup_link'>
              <input
              className='app-transition'
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              />
            <button className='app-transition' onClick={addLink}>Add Link</button>
            </div>
          </>
        }/>
      )}
    </label>
  );
};

export default Input;
