import { Link } from "react-router-dom";

import UserBadge from "../UserBadge";
import Category from "../Category";
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
        <article
            className={`post_message_card app-transition ${className}`.trim()}
        >
            <div className="post_message_card_header">
                {post.author ? (
                    <UserBadge
                        data={post.author}
                        className="post_message_card_author"
                    />
                ) : null}
                {post.category ? (
                    <Category
                        tag
                        category={post.category}
                        className="post_message_card_category"
                    />
                ) : null}
            </div>

            <Link
                to={href}
                className="post_message_card_main app-transition"
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
                    <span className="post_message_card_title">{post.title}</span>
                    {excerpt ? (
                        <span className="post_message_card_excerpt">{excerpt}</span>
                    ) : null}
                </div>
            </Link>
        </article>
    );
};

export default PostMessageCard;
