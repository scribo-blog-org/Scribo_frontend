import { Fragment, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import RichText from "../RichText";
import { LinkPreviewCard, PostMessageCard } from "../PostEntity";
import { useMessageEmbeds } from "../../hooks/useMessageEmbeds";
import { profilePathFromNick } from "../../content/plainRichText";
import { splitMessageRichParts } from "../../utils/messageLinks";
import { hashtagSearchPath } from "../../utils/hashtags";

import "./MessageContent.scss";

function hasBlockContent(parts) {
    return parts.some((part) => {
        if (part.type !== "text") {
            return true;
        }

        return part.value.length > 0;
    });
}

function buildMessageBlocks(parts) {
    const blocks = [];
    let textParts = [];

    const flushText = () => {
        if (!textParts.length || !hasBlockContent(textParts)) {
            textParts = [];
            return;
        }

        blocks.push({ type: "text", parts: textParts });
        textParts = [];
    };

    for (const part of parts) {
        if (part.type === "link") {
            flushText();
            blocks.push({ type: "link", url: part.value });
            continue;
        }

        textParts.push(part);
    }

    flushText();
    return blocks;
}

function renderInlinePart(part, key) {
    if (part.type === "tag") {
        return (
            <Link
                key={key}
                className="hashtag"
                to={hashtagSearchPath(part.value)}
            >
                {part.value}
            </Link>
        );
    }

    if (part.type === "mention") {
        return (
            <Link
                key={key}
                className="mention"
                to={profilePathFromNick(part.nick)}
            >
                {part.value}
            </Link>
        );
    }

    return String(part.value)
        .split("\n")
        .map((line, lineIndex, lines) => (
            <Fragment key={`${key}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
            </Fragment>
        ));
}

const MessageRichContent = ({ text, className, id, embeds, onLayoutChange }) => {
    const blocks = useMemo(() => {
        return buildMessageBlocks(splitMessageRichParts(text));
    }, [text]);

    const embedByUrl = useMemo(
        () => new Map(embeds.map((embed) => [embed.url, embed])),
        [embeds],
    );

    return (
        <div className={className} id={id}>
            {blocks.map((block, index) => {
                if (block.type === "link") {
                    const embed = embedByUrl.get(block.url);

                    return (
                        <div
                            className="message_content_link_block"
                            key={`link-${block.url}-${index}`}
                        >
                            <p>
                                <a
                                    className="message_link"
                                    href={block.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {block.url}
                                </a>
                            </p>
                            {embed?.type === "post" ? (
                                <PostMessageCard
                                    post={embed.post}
                                    className="messages_post_share"
                                    onMediaLoad={onLayoutChange}
                                />
                            ) : null}
                            {embed?.type === "link" ? (
                                <LinkPreviewCard
                                    preview={embed.preview}
                                    className="messages_link_preview"
                                    onMediaLoad={onLayoutChange}
                                />
                            ) : null}
                        </div>
                    );
                }

                return (
                    <p key={`text-${index}`}>
                        {block.parts.map((part, partIndex) =>
                            renderInlinePart(part, `${index}-${partIndex}`),
                        )}
                    </p>
                );
            })}
        </div>
    );
};

const MessageContent = ({
    text,
    className,
    id,
    deleted = false,
    onLayoutChange,
}) => {
    const embeds = useMessageEmbeds(deleted ? "" : text);

    useEffect(() => {
        if (!embeds.length) {
            return;
        }

        onLayoutChange?.();
    }, [embeds, onLayoutChange]);

    if (deleted) {
        return (
            <div className={`${className} messages_text_deleted`.trim()}>
                <RichText text="Сообщение удалено" />
            </div>
        );
    }

    const hasLinks = /https?:\/\//.test(text || "");

    if (hasLinks) {
        return (
            <div className="message_content">
                <MessageRichContent
                    text={text}
                    className={className}
                    id={id}
                    embeds={embeds}
                    onLayoutChange={onLayoutChange}
                />
            </div>
        );
    }

    return (
        <div className="message_content">
            <div className={className}>
                <RichText linkify id={id} text={text} />
            </div>
        </div>
    );
};

export default MessageContent;
