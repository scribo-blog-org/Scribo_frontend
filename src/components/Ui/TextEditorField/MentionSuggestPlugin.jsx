import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical";

import Flyout from "../Flyout";
import { searchUsers } from "../../../api/search.api";
import { mentionLabel } from "../../../content/mentions";
import { $isMentionNode } from "./MentionNode";

function readActiveMention() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }

  const node = selection.anchor.getNode();
  if (!$isTextNode(node) || $isMentionNode(node)) {
    return null;
  }

  const offset = selection.anchor.offset;
  const text = node.getTextContent();
  const before = text.slice(0, offset);
  const at = before.lastIndexOf("@");
  if (at < 0) {
    return null;
  }

  const token = before.slice(at);
  if (!token.startsWith("@") || token.length < 2 || /\s/.test(token)) {
    return null;
  }

  if (!/^@[a-zA-Z0-9_]{0,24}$/.test(token)) {
    return null;
  }

  return { token, node, at, offset, query: token.slice(1) };
}

function caretAnchor() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.x === 0 && rect.y === 0 && rect.width === 0 && rect.height === 0)) {
    return null;
  }
  return {
    getBoundingClientRect: () => rect,
    contextElement: selection.anchorNode?.parentElement || undefined,
  };
}

const MentionSuggestPlugin = ({ enabled }) => {
  const [editor] = useLexicalComposerContext();
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const itemsRef = useRef([]);
  const activeIndexRef = useRef(0);
  const requestId = useRef(0);

  itemsRef.current = items;
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setAnchor(null);
      return;
    }

    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const active = readActiveMention();
        const nextAnchor = active ? caretAnchor() : null;
        setAnchor(nextAnchor);

        if (!active) {
          setItems([]);
          return;
        }

        const id = ++requestId.current;
        const query = active.query;

        window.setTimeout(async () => {
          if (id !== requestId.current) {
            return;
          }
          const users = await searchUsers(query);
          if (id !== requestId.current) {
            return;
          }
          setActiveIndex(0);
          setItems(users || []);
        }, 80);
      });
    });
  }, [editor, enabled]);

  const applyUser = useCallback((user) => {
    if (!user?.nick_name) {
      return;
    }

    editor.update(() => {
      const active = readActiveMention();
      if (!active) {
        return;
      }

      const { node, at, offset } = active;
      const text = node.getTextContent();
      const label = `@${user.nick_name}`;
      const next = `${text.slice(0, at)}${label} ${text.slice(offset)}`;
      node.setTextContent(next);
      const cursor = at + label.length + 1;
      node.select(cursor, cursor);
    });
    setItems([]);
    setAnchor(null);
  }, [editor]);

  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    const intercept = (event, handler) => {
      event.preventDefault();
      handler();
      return true;
    };

    const pickActive = () => itemsRef.current[activeIndexRef.current];

    const removeDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) =>
        intercept(event, () => {
          setActiveIndex((index) => (index + 1) % itemsRef.current.length);
        }),
      COMMAND_PRIORITY_LOW,
    );
    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) =>
        intercept(event, () => {
          setActiveIndex((index) =>
            (index - 1 + itemsRef.current.length) % itemsRef.current.length,
          );
        }),
      COMMAND_PRIORITY_LOW,
    );
    const removeEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const user = pickActive();
        if (!user) {
          return false;
        }
        return intercept(event, () => applyUser(user));
      },
      COMMAND_PRIORITY_LOW,
    );
    const removeTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const user = pickActive();
        if (!user) {
          return false;
        }
        return intercept(event, () => applyUser(user));
      },
      COMMAND_PRIORITY_LOW,
    );
    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) =>
        intercept(event, () => {
          setItems([]);
          setAnchor(null);
        }),
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      removeDown();
      removeUp();
      removeEnter();
      removeTab();
      removeEscape();
    };
  }, [applyUser, editor, enabled, items.length]);

  if (!enabled || !anchor || items.length === 0) {
    return null;
  }

  return (
    <Flyout
      open
      placement="top-start"
      virtualAnchor={anchor}
      content={
        <>
          {items.map((user, index) => (
            <button
              key={user._id || user.nick_name}
              type="button"
              className={`flyout_item app-transition ${index === activeIndex ? "flyout_item_active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyUser(user)}
            >
              {mentionLabel(user)}
            </button>
          ))}
        </>
      }
    />
  );
};

export default MentionSuggestPlugin;
