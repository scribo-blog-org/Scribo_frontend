import { API_URL } from "../config";
import { apiFetch } from "./http";

export async function fetchLinkPreview(url) {
    try {
        const response = await apiFetch(
            `${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`,
        );
        return await response.json();
    } catch (error) {
        console.error(error);
        return { status: false, message: error.message };
    }
}
