import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { Link } from "react-router-dom";
import { ArticleTopic } from "../../components/ArticleTopic";
import PostsFilters from "../../components/PostsFilters";
import Loading from "../../components/Loading";
import NoPosts from "../NoPosts";
import "./Posts.scss";

const Posts =  ( { posts, isLoading, posts_filters = [] } ) => {
    const { profile } = useContext(AppContext)
    const [ filters, setFilters ] = useState([])

    useEffect(() => {
        const isPostsFiltersEmpty = posts_filters.length === 0;

        let uniqueFilters = [
            ...new Set(posts.map(post => post.category).filter(Boolean))
        ].map(category => ({
            name: category,
            is_active: isPostsFiltersEmpty
                ? true
                : posts_filters.includes(category),
        }));

        if(profile){
            uniqueFilters.unshift({
                name: "По подписке",
                is_active: posts_filters.includes("По подписке")
            });
        }
        
        uniqueFilters.unshift({
            name: "Все",
            is_active: isPostsFiltersEmpty
                ? true
                : posts_filters.includes("Все")
        });

        setFilters(uniqueFilters);
    }, [posts]);

    if(!posts) {
        return <NoPosts/>
    }
    
    const subscriptionFilterActive = filters.find(f => f.name === "По подписке")?.is_active;

    let filteredPosts = posts.filter(post =>
    filters.some(f => f.name === post.category && f.is_active)
    );

    if (subscriptionFilterActive) {
        filteredPosts = filteredPosts.filter(post =>
            profile?.follows?.includes(post.author._id)
        );
    }
    
    return (
        <div className="posts posts_columns">
            { 
                isLoading ?
                    <Loading />
                : 
                    posts.length === 0 ?
                        <NoPosts />
                    :
                        
                    <>
                        <PostsFilters filters={filters} setFilters={setFilters} />

                        {filteredPosts.length === 0 ? (
                        <NoPosts />
                        ) : (
                        filteredPosts.map(post => (
                            <div key={post._id} className="posts_item app-transition">
                            <ArticleTopic article={post} profile={profile} />
                            <div>
                                <h2 className="posts_item_title">{post.title}</h2>
                            </div>
                            {post.featured_image && (
                                <div className="posts_item_img">
                                <img src={post.featured_image} alt="" />
                                </div>
                            )}
                            <Link to={`/posts/${post._id}`} className="posts_item_link"></Link>
                            </div>
                        ))
                        )}
                    </>
            }
        </div>
    );
}

export default Posts;