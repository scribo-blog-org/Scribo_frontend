import { API_URL } from "../config";
import { apiFetch } from "./http";

const parse = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const getUnreadCount = async () => {
    const response = await apiFetch(`${API_URL}/api/chat/unread-count`);
    return parse(response);
};

const getConversations = async () => {
    const response = await apiFetch(`${API_URL}/api/chat/conversations`);
    return parse(response);
};

const createConversation = async (userId) => {
    const response = await apiFetch(`${API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });
    return parse(response);
};

const deleteConversation = async (conversationId) => {
    const response = await apiFetch(`${API_URL}/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
    });
    return parse(response);
};

const getConversation = async (conversationId) => {
    const response = await apiFetch(`${API_URL}/api/chat/conversations/${conversationId}`);
    return parse(response);
};

const getMessages = async (conversationId, params = {}) => {
    const search = new URLSearchParams();

    if (params.before) {
        search.set("before", params.before);
    }

    if (params.limit) {
        search.set("limit", String(params.limit));
    }

    const query = search.toString();
    const response = await apiFetch(
        `${API_URL}/api/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`,
    );
    return parse(response);
};

const sendMessage = async (conversationId, payload) => {
    const response = await apiFetch(
        `${API_URL}/api/chat/conversations/${conversationId}/messages`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: payload.text,
                replyTo: payload.replyTo || undefined,
            }),
        },
    );
    return parse(response);
};

const markConversationRead = async (conversationId) => {
    const response = await apiFetch(
        `${API_URL}/api/chat/conversations/${conversationId}/read`,
        { method: "POST" },
    );
    return parse(response);
};

const deleteMessage = async (messageId) => {
    const response = await apiFetch(`${API_URL}/api/chat/messages/${messageId}`, {
        method: "DELETE",
    });
    return parse(response);
};

const editMessage = async (messageId, payload) => {
    const response = await apiFetch(`${API_URL}/api/chat/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payload.text }),
    });
    return parse(response);
};

export {
    getUnreadCount,
    getConversations,
    createConversation,
    deleteConversation,
    getConversation,
    getMessages,
    sendMessage,
    markConversationRead,
    deleteMessage,
    editMessage,
};
