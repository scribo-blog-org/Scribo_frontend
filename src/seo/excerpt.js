const HTML_TAG = /<\/?[^>]+(>|$)/g;

export function plainTextExcerpt(html, maxLength = 160) {
    if (!html) {
        return "";
    }

    const text = html
        .replace(HTML_TAG, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 1).trim()}…`;
}
