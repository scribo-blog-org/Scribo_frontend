export const FIELD_LIMITS = {
    nick: { min: 3, max: 24 },
    password: { min: 8, max: 64 },
    email: { min: 3, max: 254 },
    login: { min: 3, max: 254 },
    description: { min: 0, max: 200 },
    postTitle: { min: 1, max: 120 },
    postContent: { min: 1, max: 50_000 },
    comment: { min: 1, max: 2_000 },
    categoryName: { min: 1, max: 40 },
    supportMessage: { min: 10, max: 4_000 },
    supportReply: { min: 1, max: 4_000 },
    chatMessage: { min: 1, max: 4_000 },
};
