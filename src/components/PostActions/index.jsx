import { useContext, useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';

import { AppContext } from "../../App";

import { likePost, savePost } from "../../api/posts.api";
import { hasId, setIdPresent, withId, withoutId } from "../../utils/ids";

import "./PostActions.scss";

import BookMarkBorder from "../../assets/svg/bookmark-outline.svg?react";
import BookMarkFilled from "../../assets/svg/bookmark-filled.svg?react";
import ShareIcon from "../../assets/svg/share.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import EyeIcon from "../../assets/svg/eye.svg?react";
import LikeIcon from "../../assets/svg/like-outline.svg?react";
import FilledLikeIcon from "../../assets/svg/like-filled.svg?react";

import Category from "../Category/index";
import Tooltip from "../Ui/Tooltip/index";
import SharePostModal from "../SharePostModal";

import Sceleton from "../Ui/Sceleton/Sceleton";

const PostActions = ({ className, article, setArticle, isLoading=false, showCategory = true }) => {
    const { profile, setProfile, showToast, showModalWindow, requestCloseModal } = useContext(AppContext)
    const [isSaved, setIsSaved] = useState(hasId(profile?.saved_posts, article?._id));

    const likeBusy = useRef(false)
    const likeWanted = useRef(null)

    const savedBusy = useRef(false)
    const savedWanted = useRef(null)

    useEffect(() => {
        if (savedWanted.current === null) {
            setIsSaved(hasId(profile?.saved_posts, article?._id));
        }
    }, [profile, article?._id])

    const patchArticle = (updater) => {
        setArticle((prev) => {
            const current = prev && !Array.isArray(prev) && prev._id ? prev : article
            if (!current?._id) {
                return prev
            }
            return updater(current)
        })
    }

    const getCommentsCount = (comments) => {
        if (!Array.isArray(comments)) return 0;

        return comments.reduce((count, comment) => {
            if (!comment || typeof comment !== "object") {
                return count;
            }
            return count + 1 + getCommentsCount(comment.replies);
        }, 0);
    };

    const commentsCount =
        typeof article.comments_count === "number"
            ? article.comments_count
            : getCommentsCount(article.comments);
    const viewsCount = Number(article.views_count || article.views || 0);
    const firstCommentId = Array.isArray(article.comments)
        ? article.comments.find((comment) => comment?._id)?._id
        : "";

    const flushLike = async () => {
        if (likeBusy.current || !article?._id || !profile?._id) {
            return
        }

        likeBusy.current = true

        try {
            while (likeWanted.current !== null) {
                const wantLiked = likeWanted.current
                likeWanted.current = null

                const result = await likePost(article._id, wantLiked ? "POST" : "DELETE")

                if (likeWanted.current !== null) {
                    continue
                }

                if (result.status === true && result.data?.likes) {
                    patchArticle((current) => ({ ...current, likes: result.data.likes }))
                } else if (result.statusCode === 409) {
                    patchArticle((current) => ({
                        ...current,
                        likes: setIdPresent(current.likes, profile._id, wantLiked)
                    }))
                } else {
                    patchArticle((current) => ({
                        ...current,
                        likes: setIdPresent(current.likes, profile._id, !wantLiked)
                    }))
                    showToast({ message: "Не удалось поставить лайк, попробуйте ещё раз", type: "error" })
                }
            }
        } finally {
            likeBusy.current = false
            if (likeWanted.current !== null) {
                flushLike()
            }
        }
    }

    const doLike = () => {
        if (!profile) {
            showToast({ message: "Чтобы поставить лайк, войдите в аккаунт!", type: "warning" })
            return
        }

        if (!article?._id) {
            return
        }

        const currentlyWantedLiked = likeWanted.current !== null
            ? likeWanted.current
            : hasId(article.likes, profile._id)

        const nextLiked = !currentlyWantedLiked

        likeWanted.current = nextLiked

        patchArticle((current) => ({
            ...current,
            likes: setIdPresent(current.likes, profile._id, nextLiked)
        }))

        flushLike()
    }

    const flushSave = async () => {
        if (savedBusy.current || !article?._id || !profile?._id) {
            return
        }

        savedBusy.current = true

        try {
            while (savedWanted.current !== null) {
                const wantSaved = savedWanted.current
                savedWanted.current = null

                const result = await savePost(article._id, wantSaved ? "POST" : "DELETE")

                if (savedWanted.current !== null) {
                    continue
                }

                if (result.status === true) {
                    setProfile((prev) => ({
                        ...prev,
                        saved_posts: wantSaved
                            ? withId(prev.saved_posts, article._id)
                            : withoutId(prev.saved_posts, article._id)
                    }))
                    showToast({ message: wantSaved ? "Сохранено!" : "Убрано из сохранённых!", type: "success" })
                } else if (result.statusCode === 409) {
                    setProfile((prev) => ({
                        ...prev,
                        saved_posts: wantSaved
                            ? withId(prev.saved_posts, article._id)
                            : withoutId(prev.saved_posts, article._id)
                    }))
                } else {
                    setIsSaved(!wantSaved)
                    if (result.statusCode === 401) {
                        showToast({ message: "Чтобы сохранить пост, войдите в аккаунт!", type: "warning" })
                    } else {
                        showToast({ message: "Не удалось сохранить пост, попробуйте ещё раз", type: "error" })
                    }
                }
            }
        } finally {
            savedBusy.current = false
            if (savedWanted.current !== null) {
                flushSave()
            }
        }
    }

    const openShareModal = () => {
        if (!article?._id) {
            return;
        }

        showModalWindow({
            title: "Поделиться",
            size: "small",
            content: (
                <SharePostModal
                    postId={article._id}
                    postTitle={article.title}
                    showToast={showToast}
                    requestCloseModal={requestCloseModal}
                />
            ),
        });
    };

    const doSave = () => {
        if (!profile) {
            showToast({ message: "Чтобы сохранить пост, войдите в аккаунт!", type: "warning" })
            return
        }

        if (!article?._id) {
            return
        }

        const currentlyWantedSaved = savedWanted.current !== null
            ? savedWanted.current
            : isSaved

        const nextSaved = !currentlyWantedSaved

        savedWanted.current = nextSaved
        setIsSaved(nextSaved)

        flushSave()
    }

    return (
        <div className={`post_actions ${className ?? ""}`}>
            <Sceleton isLoading={isLoading} rounded={true} className="post_actions_left_side">
                <div className="post_actions_left_side">
                    <Tooltip text={hasId(article.likes, profile?._id) ? "Убрать лайк" : "Поставить лайк"} clickable={true}>
                        <button type="button" className="post_actions_button app-transition" onClick={doLike}>
                            {
                                hasId(article.likes, profile?._id) ?
                                    <FilledLikeIcon />
                                :
                                    <LikeIcon />
                            }
                            <p>{article.likes?.length > 0 ? article.likes.length : ""}</p>
                        </button>
                    </Tooltip>
                    <Tooltip text={"Перейти к комментариям"} className="post_actions_comment"  clickable={true}>
                        <Link className="post_actions_button post_actions_comment app-transition" to={`/posts/${article._id}${firstCommentId ? `?comment=${firstCommentId}` : ""}`}>
                            <CommentIcon/>
                            {
                                commentsCount > 0 ?
                                    <p>
                                        {commentsCount}
                                    </p>
                                :
                                    <></>
                            }
                        </Link>
                    </Tooltip>
                    <Tooltip text={isSaved ? "Убрать из сохранённых" : "Сохранить"} clickable={true}>
                        <button type="button" className="post_actions_button app-transition" onClick={doSave}>
                            {isSaved ? <BookMarkFilled /> : <BookMarkBorder />}
                        </button>
                    </Tooltip>
                    <Tooltip text="Просмотры">
                        <span className="post_actions_button post_actions_views">
                            <EyeIcon />
                            <p>{viewsCount}</p>
                        </span>
                    </Tooltip>
                    <Tooltip text="Поделиться" clickable={true}>
                        <button type="button" className="post_actions_button app-transition" onClick={openShareModal}>
                            <ShareIcon />
                        </button>
                    </Tooltip>
                </div>
            </Sceleton>
            {showCategory ? (
                <Sceleton isLoading={isLoading} rounded={true} className="post_actions_right_side">
                    <div className="post_actions_right_side">
                        <Category tag category={article.category} />
                    </div>
                </Sceleton>
            ) : null}
        </div>
    )
};

export default PostActions;