import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { enrichPostHtml } from "../../content/postHtml";
import { escapeHtml, linkifyHashtagsInHtml } from "../../utils/hashtags";

const HashtagHtml = ({ html, text, className, as = "div", id }) => {
    const navigate = useNavigate();
    const Tag = as;
    const markup = useMemo(() => {
        if (html) {
            return enrichPostHtml(html);
        }
        if (text == null || text === "") {
            return "";
        }
        return linkifyHashtagsInHtml(escapeHtml(text).replace(/\n/g, "<br>"));
    }, [html, text]);

    return (
        <Tag
            id={id}
            className={className}
            dangerouslySetInnerHTML={{ __html: markup }}
            onClick={(event) => {
                const link = event.target.closest("a.hashtag, a.mention");
                if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) {
                    return;
                }
                const href = link.getAttribute("href");
                if (!href?.startsWith("/")) {
                    return;
                }
                event.preventDefault();
                navigate(href);
            }}
        />
    );
};

export default HashtagHtml;
