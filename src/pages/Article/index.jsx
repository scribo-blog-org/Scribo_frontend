import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../App";
import { API_URL } from "../../config";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../../components/Ui/Loading";
import { ArticleTopic } from "../../components/ArticleTopic";
import "./Article.scss";


const Article = () => {
    const {id} = useParams()
    const navigate = useNavigate()
    
    const [isLoading, setIsLoading] = useState(false)
    const { profile } = useContext(AppContext)
    const [article, setArticle] = useState([ ])
    
    useEffect(() => {
        getArticle()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])    

    const getArticle = async () => {
        try {
            setIsLoading(true)
            
            await fetch(`${API_URL}/api/posts/${id}?expand=author`)
            .then(res => res.json())
            .then(res => {
                if (res.status === true) {
                    setArticle(res.data)
                }
                else {
                    navigate('/404')
                }
            })
            .finally(() => {
                setIsLoading(false)
            })
            
        } catch(e) {
            navigate('/404')
        }
    }

    return (
        (!isLoading) ?
        <div>
            {
                article ?
                <div className="article">
                        <h1 className="article_title">{article.title}</h1>
                        <ArticleTopic article={article} profile={profile}/>
                        {article.featured_image ? 
                            <div className="article_featured_image">
                                <img src={article.featured_image} alt={"featured"}/> 
                            </div>
                        : 
                            <></>
                        }
                        <div className="article_content" dangerouslySetInnerHTML={{__html: article.content_text}}>
                        </div>
                    </div>:
                <></>     
            }
            </div>
        :
        <Loading /> 
    )
}

export default Article;