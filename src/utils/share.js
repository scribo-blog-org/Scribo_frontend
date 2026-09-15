import { absoluteUrl } from "../seo/site";

export function getPostShareUrl(postId) {
    if (!postId) {
        return absoluteUrl("/");
    }

    if (typeof window !== "undefined" && window.location?.origin) {
        return `${window.location.origin}/posts/${postId}`;
    }

    return absoluteUrl(`/posts/${postId}`);
}

export function canUseNativeShare() {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function copyText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

export async function sharePostNative({ title, url }) {
    if (!canUseNativeShare()) {
        return false;
    }

    await navigator.share({
        title: title || "Scribo",
        text: title || undefined,
        url,
    });

    return true;
}
