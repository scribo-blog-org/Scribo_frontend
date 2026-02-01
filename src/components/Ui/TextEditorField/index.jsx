import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot } from "lexical";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { TextNode } from "lexical";

import "./TextEditorField.scss";
import SwitchBar from "../SwitchBar";

import { ReactComponent as BoldText } from "../../../assets/svg/bold-text-icon.svg";
import { ReactComponent as ItalicText } from "../../../assets/svg/italic-text-icon.svg";
import { ReactComponent as MarkList } from "../../../assets/svg/mark-list-icon.svg";
import { ReactComponent as NumList } from "../../../assets/svg/num-list-icon.svg";
import { ReactComponent as LinkText } from "../../../assets/svg/link-icon.svg";
import { ReactComponent as WarningIcon } from "../../../assets/svg/warning-icon.svg";

import { useState, useEffect } from "react";

const editorConfig = {
  namespace: "MyEditor",
  theme: {
    text: {
      bold: "text_editor_bold",
      italic: "text_editor_italic",
    },
    link: "text_editor_link",
    list: {
      ul: "text_editor_ul",
      ol: "text_editor_ol",
    },
  },
  onError(error) {
    throw error;
  },
  nodes: [
    TextNode,
    ListNode,
    ListItemNode,
    LinkNode,
  ],
};

const EditorToolbar = () => {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="text_editor_body_top_side_toolbar app-transition">
      <button
        type="button"
        className="text_editor_body_top_side_toolbar_bold app-transition"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
        }
      >
        <BoldText />
      </button>

      <button
        type="button"
        className="app-transition"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
        }
      >
        <ItalicText />
      </button>

      <button
        type="button"
        className="app-transition"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)
        }
      >
        <MarkList />
      </button>

      <button
        type="button"
        className="app-transition"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)
        }
      >
        <NumList />
      </button>

      <button
        type="button"
        className="app-transition"
        onClick={() => {
          const url = prompt("Введите ссылку");
          if (url) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          }
        }}
      >
        <LinkText />
      </button>
    </div>
  );
}

export default function TextEditor({
  value,
  onChange,
  label,
  error,
  onFocus
}) 
{
  const [ switcherActiveIndex, setSwitcherActiveIndex ] = useState(0);

  function EditablePlugin({ editable }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      editor.setEditable(editable);
    }, [editor, editable]);

    return null;
  }

  return (
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: value
        }}
      >
      <EditablePlugin editable={switcherActiveIndex === 0} />
        <div className="text_editor app-transition">
          <div className={`text_editor_body ${error ? "incorrect_field" : ""} app-transition`}>

            <div className="text_editor_body_top_side app-transition">
              <EditorToolbar />
              <SwitchBar active_index={switcherActiveIndex} setActiveIndex={setSwitcherActiveIndex} items={["Редактировать", "Предпросмотр"]} />
            </div>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="text_editor_body_input"
                  onFocus={(e) => onFocus?.(e)}
                />
              }
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />

            <OnChangePlugin
              onChange={(editorState, editor) => {
                const result = editorState.read(() => {
                  const root = $getRoot();
                  const text = root.getTextContent().trim();

                  if (text === "") {
                    return "";
                  }

                  return $generateHtmlFromNodes(editor);
                });

                onChange?.(result);
              }}
            />
        </div>
        <div className={`input_field_label_error_message ${error ? "show" : ""}`}>
          <WarningIcon className="input_field_label_error_message_logo" />
          <p>{error}</p>
        </div>
      </div>
      </LexicalComposer>
  );
}