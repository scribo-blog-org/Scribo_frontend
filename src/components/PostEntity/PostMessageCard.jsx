import { Link } from "react-router-dom";

import UserBadge from "../UserBadge";
import { SITE_NAME } from "../../seo/site";
import { plainTextExcerpt } from "../../seo/excerpt";

import PostEntityChip from "./PostEntityChip";

import "./PostEntity.scss";

const PostMessageCard = ({ post, className = "", onMediaLoad }) => {
    if (!post?._id) {
        return <PostEntityChip deleted className={className} />;
    }

    const href = `/posts/${post._id}`;
    const excerpt =
        post.excerpt || plainTextExcerpt(post.content_text || "", 160);

    return (
        <Link
            to={href}
            className={`post_message_card app-transition ${className}`.trim()}
            onClick={(event) => event.stopPropagation()}
        >
            {post.featured_image ? (
                <div className="post_message_card_media">
                    <img
                        src={post.featured_image}
                        alt=""
                        loading="lazy"
                        onLoad={onMediaLoad}
                    />
                </div>
            ) : null}
            <div className="post_message_card_body">
                <span className="post_message_card_site">{SITE_NAME}</span>
                <span className="post_message_card_title">{post.title}</span>
                {post.author ? (
                    <UserBadge
                        data={post.author}
                        asLink={false}
                        className="post_message_card_author"
                    />
                ) : null}
                {excerpt ? (
                    <span className="post_message_card_excerpt">{excerpt}</span>
                ) : null}
            </div>
        </Link>
    );
};

export default PostMessageCard;
