import { API_URL } from "../config"
import { apiFetch } from "./http"

const trackVisit = async (path) => {
    try {
        await apiFetch(`${API_URL}/api/analytics/visit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pagePath: path,
                pageReferrer: typeof document === "undefined" ? "" : document.referrer,
            })
        })
    }
    catch {
        // tracking must never break the app
    }
}

const getDashboard = async (days = 14) => {
    const params = new URLSearchParams({ days: String(days) })
    const response = await apiFetch(`${API_URL}/api/analytics/dashboard?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })

    return await response.json()
}

export {
    trackVisit,
    getDashboard
}
