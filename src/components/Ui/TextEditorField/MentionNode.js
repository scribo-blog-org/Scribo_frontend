import {
  $createTextNode,
  TextNode,
} from "lexical";

function isCompleteMention(text) {
  return /^@[a-zA-Z0-9_]{3,24}$/.test(text);
}

export class MentionNode extends TextNode {
  static getType() {
    return "mention";
  }

  static clone(node) {
    return new MentionNode(node.__text, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createMentionNode(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "mention",
    };
  }

  applyMentionClass(element) {
    if (isCompleteMention(this.__text)) {
      element.classList.add("mention");
      element.removeAttribute("data-user-id");
    } else {
      element.classList.remove("mention");
    }
  }

  createDOM(config) {
    const element = super.createDOM(config);
    this.applyMentionClass(element);
    return element;
  }

  updateDOM(prevNode, element, config) {
    const updated = super.updateDOM(prevNode, element, config);
    this.applyMentionClass(element);
    return updated;
  }

  exportDOM(editor) {
    const output = super.exportDOM(editor);
    if (output.element instanceof HTMLElement) {
      this.applyMentionClass(output.element);
    }
    return output;
  }

  static importDOM() {
    return {
      span: (domNode) => {
        if (!domNode.classList?.contains("mention")) {
          return null;
        }
        return {
          conversion: convertMentionElement,
          priority: 3,
        };
      },
      a: (domNode) => {
        if (!domNode.classList?.contains("mention")) {
          return null;
        }
        return {
          conversion: convertMentionElement,
          priority: 3,
        };
      },
    };
  }

  canInsertTextBefore() {
    return false;
  }

  isTextEntity() {
    return true;
  }
}

function convertMentionElement(domNode) {
  const text = domNode.textContent || "";
  const label = text.startsWith("@") ? text : `@${text}`;
  if (!isCompleteMention(label)) {
    return { node: $createTextNode(label) };
  }
  return { node: $createMentionNode(label) };
}

export function $createMentionNode(text = "") {
  return new MentionNode(text);
}

export function $isMentionNode(node) {
  return node instanceof MentionNode;
}

export function registerMentionTransform(editor) {
  return editor.registerNodeTransform(TextNode, (textNode) => {
    const text = textNode.getTextContent();

    if ($isMentionNode(textNode)) {
      if (isCompleteMention(text)) {
        return;
      }
      const plain = $createTextNode(text);
      plain.setFormat(textNode.getFormat());
      plain.setStyle(textNode.getStyle());
      textNode.replace(plain);
      return;
    }

    if (!textNode.isSimpleText()) {
      return;
    }

    const match = /@[a-zA-Z0-9_]{3,24}/.exec(text);
    if (!match) {
      return;
    }

    const start = match.index;
    const end = start + match[0].length;
    let target = textNode;

    if (start > 0) {
      [, target] = textNode.splitText(start);
    }

    const mentionText = target.getTextContent();
    const mentionLength = end - start;
    const nodeToReplace =
      mentionLength < mentionText.length
        ? target.splitText(mentionLength)[0]
        : target;

    const mention = $createMentionNode(nodeToReplace.getTextContent());
    mention.setFormat(nodeToReplace.getFormat());
    mention.setStyle(nodeToReplace.getStyle());
    nodeToReplace.replace(mention);
  });
}
