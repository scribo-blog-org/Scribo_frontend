import { API_URL } from "../config";
import { getVisitorGeo } from "./geo.client";

let accessToken = null;
let socketToken = null;
let refreshPromise = null;
let authGeneration = 0;
const listeners = new Set();

export function getAccessToken() {
    return accessToken;
}

export function getSocketToken() {
    return socketToken;
}

export function setAccessToken(token) {
    accessToken = token || null;
    authGeneration += 1;
    listeners.forEach((listener) => listener(accessToken));
}

export function setSocketToken(token) {
    socketToken = token || null;
}

export function subscribeAccessToken(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function isAuthRefreshUrl(url) {
    return typeof url === "string" && url.includes("/api/auth/refresh");
}

async function parseJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((resolve) => {
            setTimeout(() => resolve(null), ms);
        }),
    ]);
}

export async function refreshAccessToken() {
    if (refreshPromise) {
        return refreshPromise;
    }

    const generation = authGeneration;

    refreshPromise = (async () => {
        try {
            const geo = (await withTimeout(getVisitorGeo(), 2000)) || {};
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(geo),
            });
            const result = await parseJson(response);

            if (generation !== authGeneration) {
                return getAccessToken();
            }

            if (!response.ok || !result?.data?.accessToken) {
                setAccessToken(null);
                setSocketToken(null);
                return null;
            }

            setAccessToken(result.data.accessToken);
            setSocketToken(result.data.socketToken);
            return result.data.accessToken;
        } catch {
            if (generation !== authGeneration) {
                return getAccessToken();
            }

            setAccessToken(null);
            setSocketToken(null);
            return null;
        }
    })().finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}

export async function apiFetch(url, options = {}) {
    const { skipAuth, _retry, headers: initHeaders, ...rest } = options;
    const headers = new Headers(initHeaders || {});
    const token = getAccessToken();

    if (!skipAuth && token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...rest,
        headers,
        credentials: "include",
    });

    if (
        response.status === 401 &&
        !_retry &&
        !skipAuth &&
        !isAuthRefreshUrl(url)
    ) {
        const nextToken = await refreshAccessToken();

        if (nextToken) {
            return apiFetch(url, { ...options, _retry: true });
        }
    }

    return response;
}
