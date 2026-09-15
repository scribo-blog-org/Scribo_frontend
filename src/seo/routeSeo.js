import { SITE_DESCRIPTION } from "./site";

const PRIVATE_PREFIXES = [
    "/admin-panel",
    "/settings",
    "/messages",
    "/notifications",
    "/create-post",
    "/auth",
    "/support/mine",
];

export function isPrivatePath(pathname) {
    if (PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }

    if (/^\/posts\/[^/]+\/edit/.test(pathname)) {
        return true;
    }

    if (/^\/support\/[^/]+/.test(pathname)) {
        return true;
    }

    return false;
}

export function getRouteSeo(pathname) {
    if (isPrivatePath(pathname)) {
        return { noindex: true, path: pathname };
    }

    if (pathname === "/" || pathname === "/posts" || pathname === "/posts/") {
        return {
            title: "Главная",
            description: SITE_DESCRIPTION,
            path: "/posts",
        };
    }

    if (pathname === "/search") {
        return {
            title: "Поиск",
            description: "Поиск статей и авторов на Scribo.",
            path: "/search",
        };
    }

    if (pathname === "/support") {
        return {
            title: "Поддержка",
            description: "Связаться с командой Scribo.",
            path: "/support",
        };
    }

    if (pathname === "/api") {
        return {
            title: "API",
            description: "Документация API Scribo.",
            path: "/api",
        };
    }

    return { path: pathname };
}
