export function messagePreviewText(message) {
    if (!message || message.deleted_at) {
        return "";
    }

    return String(message.text || "").trim();
}

export function quotePreviewText(preview) {
    if (!preview || preview.deleted || preview.deleted_at) {
        return "Сообщение удалено";
    }

    return String(preview.text || "").trim() || "Сообщение";
}
