import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams  } from "react-router-dom";
import { getPosts } from "../../api/posts.api.js";
import Banner from "../../components/Banner";
import Posts from "../../components/Posts/index.jsx";
import BannerImage from "../../assets/images/banner-img.png"
import "./HomePage.scss"

const HomePage = () => {   
    const [ posts, setPosts ] = useState([])
    const [ isLoading, setIsLoading ] = useState([])
    const [searchParams] = useSearchParams();

    const filtersFromUrl = useMemo(() => {
        return (
            searchParams
                .get("filter")
                ?.split(",")
                .map(f => f.toLowerCase()) || []
        );
    }, [searchParams]);

    const fetchPosts = async () => {
        setIsLoading(true)
        const response = await getPosts()
        if(response.status === true){
            setPosts(response.data)
        }
        else{
            setPosts([])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    return (
        <>
            <Banner 
                image={BannerImage}>

                <h1>Please, visit my github page and share this site to your friends</h1>
                <a href="https://github.com/MaksimKosyanchuk/news_site_frontend" target="_blank" rel={"noreferrer"}>GitHub</a>
                <Link to={`/users/Maks`}>My profile</Link>
            </Banner>
            <Posts posts_filters={filtersFromUrl} posts={posts} isLoading={isLoading}/>
        </>
    )
}

export default HomePage