import { formatMentionToken } from "./mentions";
import { escapeComposerHtml, splitComposerParts } from "./composerParts";
import { splitHashtags } from "../utils/hashtags";

export function segmentsToDisplay(segments) {
    return (segments || [])
        .map((segment) =>
            segment.type === "mention" ? `@${segment.nick}` : segment.value || "",
        )
        .join("");
}

export function segmentsToStorage(segments) {
    return (segments || [])
        .map((segment) =>
            segment.type === "mention"
                ? formatMentionToken(segment.userId)
                : segment.value || "",
        )
        .join("");
}

export function mentionRegistryFromSegments(segments) {
    const seen = new Set();
    const registry = [];

    for (const segment of segments || []) {
        if (segment.type !== "mention") {
            continue;
        }

        const key = `${segment.userId}:${segment.nick}`;
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        registry.push({ userId: String(segment.userId), nick: segment.nick });
    }

    return registry;
}

export function mergeMentionRegistries(...lists) {
    const map = new Map();

    for (const list of lists) {
        for (const item of list || []) {
            if (!item?.userId) {
                continue;
            }
            map.set(String(item.userId), {
                userId: String(item.userId),
                nick: item.nick,
            });
        }
    }

    return [...map.values()];
}

export function storageToSegments(storage, userMap = {}) {
    return splitComposerParts(storage).map((part) => {
        if (part.type === "mention") {
            const user = userMap[part.userId];
            return {
                type: "mention",
                userId: part.userId,
                nick: user?.nick_name || "user",
            };
        }

        return { type: "text", value: part.value };
    });
}

function findRegistryMention(text, index, registry) {
    if (text[index] !== "@") {
        return null;
    }

    const candidates = registry
        .filter((item) => text.slice(index).startsWith(`@${item.nick}`))
        .sort((a, b) => b.nick.length - a.nick.length);

    for (const item of candidates) {
        const end = index + item.nick.length + 1;
        if (
            end === text.length ||
            /[\s#.,!?;:()|[\]{}|\n]/.test(text[end])
        ) {
            return item;
        }
    }

    return null;
}

/** Parse visible display text back into segments using known mention bindings. */
export function parseDisplayToSegments(display, registry) {
    const src = String(display || "");
    const segments = [];
    let index = 0;

    if (!src) {
        return [{ type: "text", value: "" }];
    }

    while (index < src.length) {
        const mention = findRegistryMention(src, index, registry);
        if (mention) {
            segments.push({
                type: "mention",
                userId: mention.userId,
                nick: mention.nick,
            });
            index += mention.nick.length + 1;
            continue;
        }

        let next = index + 1;
        while (next < src.length && !findRegistryMention(src, next, registry)) {
            next += 1;
        }

        segments.push({ type: "text", value: src.slice(index, next) });
        index = next;
    }

    return segments.length ? segments : [{ type: "text", value: "" }];
}

export function applyMentionInDisplay(text, offset, user) {
    const src = String(text || "");
    const caret = Math.max(0, Math.min(offset ?? src.length, src.length));
    const before = src.slice(0, caret);
    const at = before.lastIndexOf("@");

    if (at < 0 || !user?._id || !user?.nick_name) {
        return null;
    }

    const token = src.slice(at, caret);
    if (!/^@[a-zA-Z0-9_]*$/.test(token) || token.length < 2 || /\s/.test(token)) {
        return null;
    }

    const label = `@${user.nick_name}`;
    const display = `${src.slice(0, at)}${label} ${src.slice(caret)}`;

    return {
        display,
        cursor: at + label.length + 1,
        mention: { userId: String(user._id), nick: user.nick_name },
    };
}

/** Colorize visible display text — same string length as the textarea value. */
function highlightTextSegment(text, hashtags) {
    if (!text) {
        return "";
    }

    if (!hashtags) {
        return escapeComposerHtml(text);
    }

    return splitHashtags(text)
        .map((part) =>
            part.type === "tag"
                ? `<span class="hashtag">${escapeComposerHtml(part.value)}</span>`
                : escapeComposerHtml(part.value),
        )
        .join("");
}

export function highlightDisplayHtml(display, registry = [], features = {}) {
    const { hashtags = true, mentions = true } = features;
    const src = String(display || "");

    if (!src) {
        return "";
    }

    const segments = parseDisplayToSegments(src, registry);

    return segments
        .map((segment) => {
            if (segment.type === "mention" && mentions) {
                return `<span class="mention">${escapeComposerHtml(`@${segment.nick}`)}</span>`;
            }

            return highlightTextSegment(segment.value, hashtags);
        })
        .join("")
        .replace(/\n/g, "<br>");
}
