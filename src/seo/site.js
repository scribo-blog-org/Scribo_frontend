export const SITE_NAME = "Scribo";

export const SITE_DESCRIPTION =
    "Scribo — платформа для публикации статей, обсуждений и личных блогов.";

export const DEFAULT_OG_IMAGE = "/logo-512.png";

export function getSiteOrigin() {
    const host = import.meta.env.VITE_APP_VERCEL_PROJECT_PRODUCTION_URL;

    if (!host) {
        return "https://scribo-blog.vercel.app";
    }

    if (host.startsWith("http://") || host.startsWith("https://")) {
        return host.replace(/\/$/, "");
    }

    const protocol = host.startsWith("localhost") ? "http" : "https";

    return `${protocol}://${host.replace(/\/$/, "")}`;
}

export function absoluteUrl(path = "/") {
    const normalized = path.startsWith("/") ? path : `/${path}`;

    return `${getSiteOrigin()}${normalized}`;
}

export function pageTitle(title) {
    return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}
