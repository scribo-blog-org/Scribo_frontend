import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import PostComment from "../../components/PostComments/index";
import Loading from "../../components/Ui/Loading";
import PostActions from "../../components/PostActions";
import "./Article.scss";
import HashtagHtml from "../../components/HashtagHtml";
import PostHeader from "../../components/PostHeader";

import { getPostById } from "../../api/posts.api";
import PageSeo from "../../components/Seo/index.jsx";
import { plainTextExcerpt } from "../../seo/excerpt.js";

const Article = () => {
    const {id} = useParams()
    let [searchParams] = useSearchParams();
    const [comment, setComment] = useState(searchParams.get('comment') || null)
    const location = useLocation()
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(false)
    const [article, setArticle] = useState(null)

    useEffect(() => {
        const getArticle = async () => {
            try {
                setIsLoading(true)

                const result = await getPostById(id, {
                    expand: "author,category",
                    view: 1,
                })

                if (result.status) {
                    setArticle(result.data)
                } else {
                    navigate("/404")
                }
            } catch {
                navigate("/404")
            } finally {
                setIsLoading(false)
            }
        }

        getArticle()
    }, [id, navigate])

    useEffect(() => {
        if (location.state?.comment) {
            setComment(location.state.comment)
            return
        }

        const commentId = searchParams.get("comment")

        if (commentId) {
            setComment(commentId)
        }
    }, [location.state?.comment, searchParams])


    return (
        (!isLoading && article?._id) ?
        <div>
            <PageSeo
                title={article.title}
                description={plainTextExcerpt(article.content_text) || article.title}
                path={`/posts/${article._id}`}
                image={article.featured_image || undefined}
                type="article"
            />
            {
                article._id ?
                <div className="article">
                
                    <h1 className="article_title">{article.title}</h1>
                    <div className="article_topic">
                        <PostHeader post={article} onDeletePost={() => navigate('/posts')} />
                        <PostActions article={article} setArticle={setArticle} onDeletePost={() => navigate('/posts')} />
                    </div>
                    {article.featured_image ? 
                        <div className="article_featured_image">
                            <img src={article.featured_image} alt={"featured"}/> 
                        </div>
                    : 
                        <></>
                    }
                    <HashtagHtml className="article_content" html={article.content_text} />
                    <PostComment
                        postId={article._id}
                        navigateTo={comment}
                        onCommentsChange={(comments, commentsCount) => {
                            setArticle((current) =>
                                current
                                    ? {
                                        ...current,
                                        comments,
                                        comments_count: commentsCount,
                                    }
                                    : current,
                            );
                        }}
                    />
                </div>
                :
                <></>     
            }
            </div>
        :
        <Loading size={48}/> 
    )
}

export default Article;