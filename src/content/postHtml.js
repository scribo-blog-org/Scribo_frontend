import { MENTION_STORAGE_PATTERN } from "./mentions";
import { MENTION_IN_TEXT, profilePathFromNick } from "./plainRichText";
import { linkifyHashtagsInHtml } from "../utils/hashtags";

const SKIP_TAGS = new Set(["A", "SCRIPT", "STYLE", "TEXTAREA", "CODE"]);

function stripLegacyMentionMarkup(html) {
    if (!html) {
        return "";
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("[data-user-id]").forEach((node) => {
        node.replaceWith(doc.createTextNode(node.textContent || ""));
    });

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    for (const node of textNodes) {
        const stripped = String(node.nodeValue || "").replace(MENTION_STORAGE_PATTERN, "");
        if (stripped !== node.nodeValue) {
            node.nodeValue = stripped;
        }
    }

    return doc.body.innerHTML;
}

function linkifyPlainMentionsInHtml(html) {
    if (!html) {
        return "";
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("span.mention").forEach((node) => {
        const nick = (node.textContent || "").replace(/^@/, "");
        const link = doc.createElement("a");
        link.className = "mention";
        link.href = profilePathFromNick(nick);
        link.textContent = node.textContent || `@${nick}`;
        node.replaceWith(link);
    });

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest("a")) {
            continue;
        }

        const text = node.nodeValue || "";
        MENTION_IN_TEXT.lastIndex = 0;
        if (!MENTION_IN_TEXT.test(text)) {
            continue;
        }

        MENTION_IN_TEXT.lastIndex = 0;
        const fragment = doc.createDocumentFragment();
        let lastIndex = 0;
        let match = MENTION_IN_TEXT.exec(text);

        while (match) {
            if (match.index > lastIndex) {
                fragment.appendChild(doc.createTextNode(text.slice(lastIndex, match.index)));
            }

            const nick = match[0].slice(1);
            const link = doc.createElement("a");
            link.className = "mention";
            link.href = profilePathFromNick(nick);
            link.textContent = match[0];
            fragment.appendChild(link);
            lastIndex = match.index + match[0].length;
            match = MENTION_IN_TEXT.exec(text);
        }

        if (lastIndex < text.length) {
            fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
        }

        parent.replaceChild(fragment, node);
    }

    return doc.body.innerHTML;
}

export function enrichPostHtml(html) {
    if (!html) {
        return "";
    }

    const cleaned = stripLegacyMentionMarkup(html);
    return linkifyHashtagsInHtml(linkifyPlainMentionsInHtml(cleaned));
}

/** @deprecated Legacy id-based mentions; kept for old saved HTML. */
export function extractMentionUserIdsFromHtml(html) {
    if (!html) {
        return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const ids = [];

    doc.querySelectorAll("[data-user-id]").forEach((node) => {
        const id = node.getAttribute("data-user-id");
        if (id) {
            ids.push(id);
        }
    });

    return [...new Set(ids)];
}
