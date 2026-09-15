import { Fragment } from "react";
import { Link } from "react-router-dom";

import {
    profilePathFromNick,
    splitPlainRichParts,
} from "../../content/plainRichText";
import { splitMessageRichParts } from "../../utils/messageLinks";
import { hashtagSearchPath } from "../../utils/hashtags";

const RichText = ({ text, className, id, as: Tag = "p", linkify = false }) => {
    const parts = linkify ? splitMessageRichParts(text) : splitPlainRichParts(text);

    return (
        <Tag className={className} id={id}>
            {parts.map((part, index) => {
                if (part.type === "tag") {
                    return (
                        <Link
                            key={`${part.value}-${index}`}
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
                            key={`${part.nick}-${index}`}
                            className="mention"
                            to={profilePathFromNick(part.nick)}
                        >
                            {part.value}
                        </Link>
                    );
                }

                if (part.type === "link") {
                    return (
                        <a
                            key={`${part.value}-${index}`}
                            className="message_link"
                            href={part.value}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part.value}
                        </a>
                    );
                }

                return String(part.value)
                    .split("\n")
                    .map((line, lineIndex, lines) => (
                        <Fragment key={`${index}-${lineIndex}`}>
                            {line}
                            {lineIndex < lines.length - 1 ? <br /> : null}
                        </Fragment>
                    ));
            })}
        </Tag>
    );
};

export default RichText;
