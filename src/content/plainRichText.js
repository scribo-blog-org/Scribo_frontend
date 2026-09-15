import { stripLegacyMentionTokens } from "./mentions";
import { escapeComposerHtml } from "./composerParts";

/** Visible @nick in plain text (nick 3–24 chars). */
export const MENTION_IN_TEXT = /@[a-zA-Z0-9_]{3,24}/g;
const MENTION_OR_TAG = /(@[a-zA-Z0-9_]{3,24}|#[^\s#]+)/g;

export function splitPlainRichParts(text) {
    const src = stripLegacyMentionTokens(text);
    const parts = [];
    MENTION_OR_TAG.lastIndex = 0;
    let lastIndex = 0;
    let match = MENTION_OR_TAG.exec(src);

    while (match) {
        if (match.index > lastIndex) {
            parts.push({ type: "text", value: src.slice(lastIndex, match.index) });
        }

        const value = match[0];
        if (value.startsWith("@")) {
            parts.push({ type: "mention", value, nick: value.slice(1) });
        } else {
            parts.push({ type: "tag", value });
        }

        lastIndex = match.index + value.length;
        match = MENTION_OR_TAG.exec(src);
    }

    if (lastIndex < src.length) {
        parts.push({ type: "text", value: src.slice(lastIndex) });
    }

    return parts;
}

export function highlightPlainRichHtml(text, features = {}) {
    const { hashtags = true, mentions = true } = features;
    const src = stripLegacyMentionTokens(text);

    if (!src) {
        return "";
    }

    return splitPlainRichParts(src)
        .map((part) => {
            if (part.type === "tag" && hashtags) {
                return `<span class="hashtag">${escapeComposerHtml(part.value)}</span>`;
            }

            if (part.type === "mention" && mentions) {
                return `<span class="mention">${escapeComposerHtml(part.value)}</span>`;
            }

            return escapeComposerHtml(part.value);
        })
        .join("")
        .replace(/\n/g, "<br>");
}

export function profilePathFromNick(nick) {
    if (!nick) {
        return "/search";
    }
    return `/users/${encodeURIComponent(nick)}`;
}
