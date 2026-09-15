import { MENTION_STORAGE_PATTERN } from "./mentions";
import { HASHTAG_PATTERN } from "../utils/hashtags";

const COMPOSER_TOKEN =
    /(@\[user:[a-f0-9]{24}\]|#[^\s#]+)/gi;

/** Split stored text into plain text, hashtag, and mention segments. */
export function splitComposerParts(text) {
    const src = String(text || "");
    const parts = [];
    COMPOSER_TOKEN.lastIndex = 0;
    let lastIndex = 0;
    let match = COMPOSER_TOKEN.exec(src);

    while (match) {
        if (match.index > lastIndex) {
            parts.push({ type: "text", value: src.slice(lastIndex, match.index) });
        }

        const value = match[0];
        if (value.startsWith("@")) {
            parts.push({ type: "mention", value, userId: value.slice(7, -1) });
        } else {
            parts.push({ type: "tag", value });
        }

        lastIndex = match.index + value.length;
        match = COMPOSER_TOKEN.exec(src);
    }

    if (lastIndex < src.length) {
        parts.push({ type: "text", value: src.slice(lastIndex) });
    }

    return parts;
}

export function escapeComposerHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function highlightComposerHtml(text, userMap = {}) {
    return splitComposerParts(text)
        .map((part) => {
            if (part.type === "tag") {
                return `<span class="hashtag">${escapeComposerHtml(part.value)}</span>`;
            }

            if (part.type === "mention") {
                const user = userMap[part.userId];
                const label = user?.nick_name ? `@${user.nick_name}` : "@user";
                return `<span class="mention">${escapeComposerHtml(label)}</span>`;
            }

            return escapeComposerHtml(part.value);
        })
        .join("")
        .replace(/\n/g, "<br>");
}

export { HASHTAG_PATTERN, MENTION_STORAGE_PATTERN };
