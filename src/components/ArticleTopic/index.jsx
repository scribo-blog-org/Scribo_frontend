import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import Author from "../Author";
import { API_URL } from "../../config";
import "./ArticleTopic.scss";
import { ReactComponent as BookMarkBorder} from "../../assets/svg/bookmark-outline-icon.svg";
import { ReactComponent as BookMarkFilled} from "../../assets/svg/bookmark-filled-icon.svg";
import { ReactComponent as ShareIcon} from "../../assets/svg/share-icon.svg";
import { Link } from 'react-router-dom';

function isMobile() {
    return navigator.maxTouchPoints > 0;
}

async function share(id, showToast) {
    if(isMobile()){
        navigator.share({
            title: 'Заголовок',
            text: 'Текст',
            url: `https://${process.env.REACT_APP_VERCEL_PROJECT_PRODUCTION_URL}/posts/${id}`
        })
    }
    else{
        try {
            await navigator.clipboard.writeText(`https://${process.env.REACT_APP_VERCEL_PROJECT_PRODUCTION_URL}/posts/${id}`)
            showToast({message: "Скопировано!", type: "success" })
        } catch (err) {
            console.error(`Failed to copy: /posts/${id}`, err)
        }
    }
}

function format_date(date) {
    date = new Date(date);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}.${month}.${year}`;
}

const ArticleTopic = ({ article }) => {
    const { profile, setProfile, showToast } = useContext(AppContext)
    const [isSaved, setIsSaved] = useState(profile && profile.saved_posts && article && article._id && profile.saved_posts.includes(article._id))
    const [ isSavingProcess, setSavingProcess ] = useState(false)

    useEffect(() => {
        setIsSaved(profile && profile.saved_posts && article && article._id && profile.saved_posts.includes(article._id))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile])

    const save_post = async () => {
        setSavingProcess(true)
        const requestOptions = {
            method: profile?.saved_posts?.some( (post) => { return post.toString() === article._id } ) ? 'DELETE' : 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}`}
        };

        try {
            let result = await fetch(`${API_URL}/api/profile/save-post/${article._id}`, requestOptions)
            result = await result.json();
            if (result.status === true) {
                let saved_posts = isSaved ? profile.saved_posts.filter(element => element !== article._id ) : [...profile.saved_posts, article._id]
                setProfile({ ...profile, saved_posts: saved_posts })
                showToast({ message: isSaved ? "Убрано из сохранённых!" : "Сохранено!", type: "success" });
                setIsSaved(!isSaved)
            }
            else {
                showToast({ message: "Чтобы сохранить пост, войдите в аккаунт!", type: "warning" })
            }
        } catch (error) {
            console.log(error)
        }
        finally{
            setSavingProcess(false)
        }
    };

    return (
        <div className="article_topic">

            <Author author_data={article.author} />
            <Link className="article_topic_category" to={`/posts?filter=${article.category}`}>
                <button type="button" className="app-transition category" >{article.category}</button>
            </Link>
            <div className="article_topic_right_side">

            <p className="article_topic_date">{format_date(article.created_date)}</p>
            <button type="button" className="article_topic_button article_topic_share" onClick={() => 
            {
                share(article._id, showToast)
            }}>
                <ShareIcon />
            </button>
            <button type="button" className="article_topic_button article_topic_save" onClick={save_post} disabled={isSavingProcess}>
                {
                    (isSaved ? <BookMarkFilled /> : <BookMarkBorder />)
                }
            </button>
            </div>
        </div>
    )
}

export  { ArticleTopic }