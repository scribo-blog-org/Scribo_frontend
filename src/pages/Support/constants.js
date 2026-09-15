export const SUPPORT_KINDS = [
    { value: "complaint", name: "Жалоба" },
    { value: "request", name: "Вопрос" },
    { value: "help", name: "Помощь" }
]

export const SUPPORT_STATUSES = [
    { value: "new", name: "Новый" },
    { value: "in_review", name: "На рассмотрении" },
    { value: "reviewed", name: "Рассмотрено" }
]

export const kindLabel = (kind) =>
    SUPPORT_KINDS.find((item) => item.value === kind)?.name ?? kind

export const statusLabel = (status) =>
    SUPPORT_STATUSES.find((item) => item.value === status)?.name ?? status
