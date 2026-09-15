import { API_URL } from "../config";
import { apiFetch } from "./http";

const searchSite = async (q) => {
    const query = String(q || "").trim();
    if (query.length < 2) {
        return {
            status: true,
            data: { posts: [], users: [], categories: [] },
        };
    }

    try {
        const response = await apiFetch(
            `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
        );
        return await response.json();
    } catch (err) {
        return {
            status: false,
            message: err?.message || "Search failed",
            data: null,
        };
    }
};

const searchHashtags = async (q) => {
    const query = String(q || "").trim();
    if (query.length < 2) {
        return [];
    }

    try {
        const response = await apiFetch(
            `${API_URL}/api/search/hashtags?q=${encodeURIComponent(query)}`,
        );
        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
    } catch {
        return [];
    }
};

const searchUsers = async (q) => {
    const query = String(q || "").trim().replace(/^@/, "");
    if (query.length < 1) {
        return [];
    }

    try {
        const result = await searchSite(query);
        return Array.isArray(result?.data?.users) ? result.data.users : [];
    } catch {
        return [];
    }
};

export { searchSite, searchHashtags, searchUsers };
