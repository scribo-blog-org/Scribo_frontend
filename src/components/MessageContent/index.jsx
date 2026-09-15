import { useEffect } from "react";

import RichText from "../RichText";
import { LinkPreviewCard, PostMessageCard } from "../PostEntity";
import { useMessageEmbeds } from "../../hooks/useMessageEmbeds";
import { isOnlyEmbedUrl } from "../../utils/messageLinks";

import "./MessageContent.scss";

const MessageContent = ({
    text,
    className,
    id,
    deleted = false,
    onLayoutChange,
}) => {
    const embeds = useMessageEmbeds(deleted ? "" : text);
    const hideLinkText =
        embeds.length === 1 && isOnlyEmbedUrl(text, embeds[0]?.url);

    useEffect(() => {
        if (!embeds.length) {
            return;
        }

        onLayoutChange?.();
    }, [embeds, hideLinkText, onLayoutChange]);

    if (deleted) {
        return (
            <RichText
                className={`${className} messages_text_deleted`.trim()}
                as="div"
                text="Сообщение удалено"
            />
        );
    }

    return (
        <div className="message_content">
            {!hideLinkText ? (
                <RichText
                    linkify
                    className={className}
                    id={id}
                    as="div"
                    text={text}
                />
            ) : null}
            {embeds.length ? (
                <div className="message_content_embeds">
                    {embeds.map((embed) =>
                        embed.type === "post" ? (
                            <PostMessageCard
                                key={embed.url}
                                post={embed.post}
                                className="messages_post_share"
                                onMediaLoad={onLayoutChange}
                            />
                        ) : (
                            <LinkPreviewCard
                                key={embed.url}
                                preview={embed.preview}
                                className="messages_link_preview"
                                onMediaLoad={onLayoutChange}
                            />
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default MessageContent;
