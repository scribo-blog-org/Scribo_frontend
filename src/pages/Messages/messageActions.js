export function getMessageActions({
    message,
    isOwn,
    isChatLoading,
    editingMessage,
    handlers,
}) {
    if (!message || message.deleted_at) {
        return [];
    }

    const items = [
        {
            id: "reply",
            title: "Ответить",
            icon: handlers.icons.reply,
            onClick: () => handlers.onReply(message),
            disabled: isChatLoading,
        },
    ];

    if (isOwn) {
        items.push(
            {
                id: "edit",
                title: "Изменить",
                icon: handlers.icons.edit,
                onClick: () => handlers.onEdit(message),
                disabled: isChatLoading || Boolean(editingMessage),
            },
            {
                id: "delete",
                title: "Удалить",
                icon: handlers.icons.delete,
                type: "danger",
                onClick: () => handlers.onDelete(message._id),
                disabled: isChatLoading || Boolean(editingMessage),
            },
        );
    }

    return items;
}
