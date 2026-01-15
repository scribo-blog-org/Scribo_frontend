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
    const [ filteredPosts, setFilteredPosts ] = useState()

    useEffect(() => {
        const isPostsFiltersEmpty = posts_filters.length === 0;

        let uniqueFilters = [
            ...new Set(posts.map(post => post.category).filter(Boolean))
        ].map(category => ({
            name: category,
            is_active: isPostsFiltersEmpty
                ? 
                    true
                : 
                    (posts_filters.includes("все") ? true : posts_filters.includes(category.toLowerCase())),
        }));

        if(profile){
            uniqueFilters.unshift({
                name: "По подписке",
                is_active: posts_filters.includes("по подписке")
            });
        }
        
        uniqueFilters.unshift({
            name: "Все",
            is_active: isPostsFiltersEmpty
                ? true
                : posts_filters.includes("все")
        });
        setFilters(uniqueFilters);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts, posts_filters ]);

    useEffect(() => {
        
        const subscriptionFilterActive = filters.find(f => f.name.toLowerCase() === "по подписке")?.is_active;

        let updated_posts = posts.filter(post =>
            filters.some(f => f.name?.toLowerCase() === post.category?.toLowerCase() && f?.is_active)
        );
        if (subscriptionFilterActive) {
            updated_posts = updated_posts.filter(post =>
                profile?.follows?.map(id => id?.toLowerCase())?.includes(post.author._id.toLowerCase())
            );
        }
        
        setFilteredPosts(updated_posts)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])

    if(!posts) {
        return <NoPosts/>
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