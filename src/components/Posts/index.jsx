import { useContext } from "react";
import { AppContext } from "../../App";
import { Link } from "react-router-dom";
import { ArticleTopic } from "../../components/ArticleTopic";
import Loading from "../../components/Loading";
import NoPosts from "../NoPosts";
import "./Posts.scss";

const Posts =  ( { posts, isLoading } ) => {
    const { profile } = useContext(AppContext)

    if(!posts) {
        return <NoPosts/>
    }
    
    return (
        <div className="posts posts_columns">
        {
            isLoading ?
                <Loading/> :
                posts.length === 0 ? 
                    <NoPosts/> :
                posts.map(post => {
                    return (
                        <div key={post._id}  className="posts_item app-transition">
                            <ArticleTopic article={post} profile={profile}/>
                            <div>
                                <h2 className="posts_item_title">{post.title}</h2>
                            </div>
                            {post.featured_image ? 
                                <div className="posts_item_img">
                                    <img src={post.featured_image} alt="" />
                                </div>
                            : 
                                <></>
                            }
                            {/* <p className="posts_item_content_text">{post.content_text}</p>
                            <p className="posts_item_content_text_more">еще...</p> */}
                            <Link to={`/posts/${post._id}`} className="posts_item_link"></Link>
                            </div>
                        )
                    }
                )
        }
        </div>
    )
}

export default Posts;