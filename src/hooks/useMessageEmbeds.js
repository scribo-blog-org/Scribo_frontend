import { useEffect, useState } from "react";

import { getPostById } from "../api/posts.api";
import { fetchLinkPreview } from "../api/linkPreview.api";
import { plainTextExcerpt } from "../seo/excerpt";
import { extractUrls, parseOwnPostUrl } from "../utils/messageLinks";

export function useMessageEmbeds(text) {
    const [embeds, setEmbeds] = useState([]);

    useEffect(() => {
        const urls = extractUrls(text);

        if (!urls.length) {
            setEmbeds([]);
            return;
        }

        let cancelled = false;

        (async () => {
            const resolved = await Promise.all(
                urls.map(async (url) => {
                    const postId = parseOwnPostUrl(url);

                    if (postId) {
                        const result = await getPostById(postId, { expand: "author" });

                        if (result?.status === true && result.data) {
                            return {
                                type: "post",
                                url,
                                post: {
                                    ...result.data,
                                    excerpt: plainTextExcerpt(result.data.content_text),
                                },
                            };
                        }

                        return null;
                    }

                    const preview = await fetchLinkPreview(url);

                    if (preview?.status === true && preview.data?.title) {
                        return {
                            type: "link",
                            url,
                            preview: preview.data,
                        };
                    }

                    return null;
                }),
            );

            if (!cancelled) {
                setEmbeds(resolved.filter(Boolean));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [text]);

    return embeds;
}
