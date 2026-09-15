/** Legacy id tokens — strip on read, do not render. */
export const MENTION_STORAGE_PATTERN = /@\[user:([a-f0-9]{24})\]/gi;
export const MENTION_STORAGE_TOKEN = /@\[user:[a-f0-9]{24}\]/;
export const MENTION_TYPED_PATTERN = /^@[a-zA-Z0-9_]{0,24}$/;

export function stripLegacyMentionTokens(text) {
    return String(text || "").replace(MENTION_STORAGE_PATTERN, "");
}

export function formatMentionToken(userId) {
    return `@[user:${String(userId || "").trim()}]`;
}

export function extractMentionUserIds(text) {
    const ids = [];
    const seen = new Set();
    const pattern = new RegExp(MENTION_STORAGE_PATTERN.source, "gi");
    let match = pattern.exec(String(text || ""));

    while (match) {
        const id = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
        match = pattern.exec(String(text || ""));
    }

    return ids;
}

export function mentionLabel(user) {
    return user?.nick_name ? `@${user.nick_name}` : "@user";
}

export function profilePath(user) {
    if (!user?.nick_name) {
        return "/search";
    }
    return `/users/${encodeURIComponent(user.nick_name)}`;
}

export function getActiveMention(text, offset) {
    const src = String(text || "");
    const caret = Math.max(0, Math.min(offset ?? src.length, src.length));
    const before = src.slice(0, caret);
    const at = before.lastIndexOf("@");

    if (at < 0) {
        return null;
    }

    const token = src.slice(at, caret);

    if (!token.startsWith("@") || token.length < 2) {
        return null;
    }

    if (!MENTION_TYPED_PATTERN.test(token)) {
        return null;
    }

    if (/\s/.test(token)) {
        return null;
    }

    return { token, at, offset: caret, query: token.slice(1) };
}

export function applyMentionAtCursor(text, offset, user) {
    const active = getActiveMention(text, offset);
    if (!active || !user?.nick_name) {
        return { text, cursor: offset };
    }

    const label = `@${user.nick_name}`;
    const next = `${srcSlice(text, 0, active.at)}${label} ${srcSlice(text, offset)}`;
    return { text: next, cursor: active.at + label.length + 1 };
}

function srcSlice(text, start, end) {
    return String(text || "").slice(start, end);
}
