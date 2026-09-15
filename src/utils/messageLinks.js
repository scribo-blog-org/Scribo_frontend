import { getSiteOrigin } from "../seo/site";
import { stripLegacyMentionTokens } from "../content/mentions";

export const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/g;
const MESSAGE_RICH = /(@[a-zA-Z0-9_]{3,24}|#[^\s#]+|https?:\/\/[^\s<>"']+)/g;

export function trimUrlToken(raw) {
    return String(raw || "").replace(/[)\].,!?;:]+$/g, "");
}

export function getAllowedOrigins() {
    const origins = new Set([getSiteOrigin()]);

    if (typeof window !== "undefined" && window.location?.origin) {
        origins.add(window.location.origin);
    }

    const host = import.meta.env.VITE_APP_VERCEL_PROJECT_PRODUCTION_URL;
    if (host) {
        const normalized = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
        origins.add(`https://${normalized}`);
        origins.add(`http://${normalized}`);
    }

    return origins;
}

export function parseOwnPostUrl(rawUrl) {
    try {
        const url = new URL(trimUrlToken(rawUrl));
        const origin = `${url.protocol}//${url.host}`;

        if (!getAllowedOrigins().has(origin)) {
            return null;
        }

        const match = url.pathname.match(/^\/posts\/([a-f0-9]{24})\/?$/i);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export function extractUrls(text) {
    const src = stripLegacyMentionTokens(String(text || ""));
    const urls = [];
    URL_IN_TEXT.lastIndex = 0;
    let match = URL_IN_TEXT.exec(src);

    while (match) {
        urls.push(trimUrlToken(match[0]));
        match = URL_IN_TEXT.exec(src);
    }

    return [...new Set(urls)];
}

export function splitMessageRichParts(text) {
    const src = stripLegacyMentionTokens(text);
    const parts = [];
    MESSAGE_RICH.lastIndex = 0;
    let lastIndex = 0;
    let match = MESSAGE_RICH.exec(src);

    while (match) {
        if (match.index > lastIndex) {
            parts.push({ type: "text", value: src.slice(lastIndex, match.index) });
        }

        const value = match[0];
        if (value.startsWith("@")) {
            parts.push({ type: "mention", value, nick: value.slice(1) });
        } else if (value.startsWith("#")) {
            parts.push({ type: "tag", value });
        } else {
            parts.push({ type: "link", value: trimUrlToken(value) });
        }

        lastIndex = match.index + value.length;
        match = MESSAGE_RICH.exec(src);
    }

    if (lastIndex < src.length) {
        parts.push({ type: "text", value: src.slice(lastIndex) });
    }

    return parts;
}

export function isOnlyEmbedUrl(text, url) {
    if (!url) {
        return false;
    }

    return stripLegacyMentionTokens(String(text || "")).trim() === String(url).trim();
}
