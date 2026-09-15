import { useEffect } from "react";

import {
    SITE_NAME,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    absoluteUrl,
    pageTitle,
} from "./site";

function upsertMetaByName(name, content) {
    if (!content) {
        return;
    }

    let element = document.head.querySelector(`meta[name="${name}"]`);

    if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
    }

    element.setAttribute("content", content);
}

function upsertMetaByProperty(property, content) {
    if (!content) {
        return;
    }

    let element = document.head.querySelector(`meta[property="${property}"]`);

    if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
    }

    element.setAttribute("content", content);
}

function upsertLink(rel, href) {
    if (!href) {
        return;
    }

    let element = document.head.querySelector(`link[rel="${rel}"]`);

    if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
    }

    element.setAttribute("href", href);
}

export function usePageSeo({
    title,
    description = SITE_DESCRIPTION,
    path = "/",
    image,
    noindex = false,
    type = "website",
}) {
    useEffect(() => {
        const canonical = absoluteUrl(path);
        const fullTitle = pageTitle(title);
        const robots = noindex ? "noindex, nofollow" : "index, follow";
        const ogImage = image || absoluteUrl(DEFAULT_OG_IMAGE);

        document.title = fullTitle;

        upsertMetaByName("description", description);
        upsertMetaByName("robots", robots);
        upsertMetaByName("twitter:card", image ? "summary_large_image" : "summary");
        upsertMetaByName("twitter:title", fullTitle);
        upsertMetaByName("twitter:description", description);
        upsertMetaByName("twitter:image", ogImage);

        upsertMetaByProperty("og:title", fullTitle);
        upsertMetaByProperty("og:description", description);
        upsertMetaByProperty("og:url", canonical);
        upsertMetaByProperty("og:type", type);
        upsertMetaByProperty("og:site_name", SITE_NAME);
        upsertMetaByProperty("og:image", ogImage);
        upsertMetaByProperty("og:locale", "ru_RU");

        upsertLink("canonical", canonical);
    }, [title, description, path, image, noindex, type]);
}
