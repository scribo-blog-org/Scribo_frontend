import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../App.js";
import { API_URL } from "../../config";
import { getPosts } from "../../api/posts.api.js";
import { getUsers } from "../../api/users.api.js";
import Posts from "../../components/Posts/index.jsx"
import Loading from "../../components/Loading";
import Author from "../../components/Author"
import "./Profile.scss"
import DefaultProfileAvatar from "../../assets/images/default-profile-avatar.png"
import { ReactComponent as Verified } from "../../assets/svg/verified-icon.svg";
import { ReactComponent as Calendar } from "../../assets/svg/calendar-icon.svg";
import FollowButton from "../../components/FollowButton/index.jsx";

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    let tabs = ["Посты", "Сохранённые"];
    const { profile, setProfile, showToast, showModalWindow } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [activePosts, setActivePosts] = useState([]);
    const [user, setUser] = useState(null);
    const [newData, setNewData] = useState(null);

    useEffect(() => {
        setProfile({
            ...profile,
            follows: newData?.follower?.follows,
            notifications: newData?.follower?.notifications
        })
        if(profile?._id !== user?._id) {
            setUser({
                ...user,
                followers: newData?.followed?.followers,
                follows: newData?.followed?.follows
            })
        }
        else {
            setUser({
                ...user,
                followers: newData?.follower?.followers,
                follows: newData?.follower?.follows
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newData])

    useEffect(() => {
        const getUser = async () => {
            try {
                let response = await fetch(`${API_URL}/api/users/${id}`);
                let findNeededUser = await response.json();

                if (findNeededUser.status === false) {
                    navigate('/404');
                } else {
                    setUser(findNeededUser.data);
                }
            } catch (e) {
                console.log(e);
                navigate('/404');
            }
        };
        getUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (user && user._id) {
            fetchPosts({ author: user._id }).then(data => setPosts(data));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    useEffect(() => {
        if (activeTab === "Посты") {
            setActivePosts(posts);
        } else if (activeTab === "Сохранённые") {
            if (profile?.saved_posts?.length > 0) {
                fetchPosts({ _id: profile.saved_posts }).then(data => setActivePosts(data));
            } else {
                setActivePosts([]);
            }
        }
    }, [activeTab, posts, profile?.saved_posts]);

    const fetchPosts = async (query) => {
        setIsLoading(true);
        const response = await getPosts(query);
        setIsLoading(false);
        return response.status === true ? response.data : [];
    };

    const handleTabClick = async (item) => {
        if (item === "Сохранённые" && (!profile || profile._id !== user._id)) {
            return;
        }
        setActiveTab(item);

        if (item === "Посты" && user?._id) {
            setIsLoading(true);
            const updatedPosts = await fetchPosts({ author: user._id });
            setPosts(updatedPosts);
            setIsLoading(false);
        }
    };

    const quitButtonClick = () => {
        localStorage.removeItem('token');
        showToast({ message: "Вы вышли из аккаунта!", type: "success" });
        navigate('/posts');
    };

    const fetchUsers = async (query) => {
        const response = await getUsers(query);
        return response.status === true ? response.data : [];
    }

    const open_follows = async () => {
        const follows =  user?.follows?.map(item => ({ _id: item }));
        const result = await fetchUsers(follows)

        showModalWindow(
            {
                title: `Подписки`,
                content: result.map(authorData => (
                    <div key={authorData._id} className="modal_window_body_content_user">
                        <Author author_data={authorData} />
                        <FollowButton setNewData={setNewData} author_id={authorData._id}/>
                    </div>
                  ))
            }
        )
    }

    const open_followers = async () => {
        const follows =  user?.followers?.map(item => ({ _id: item }));
        const result = await fetchUsers(follows)
        
        showModalWindow(
            {
                title: `Подписчики`,
                content: result.map(authorData => (
                    <div key={authorData?._id } className="modal_window_body_content_user">
                        <Author author_data={authorData} />
                        <FollowButton setNewData={setNewData} author_id={authorData._id}/>
                    </div>
                  ))
            }
        )
    }

    if (!user) {
        return <Loading />;
    }

    const format_date = (date) => {
        date = new Date(date);

        const months = [
            "января", "февраля", "марта", "апреля", 
            "мая", "июня", "июля", "августа", 
            "сентября", "октября", "ноября", "декабря"
          ];

        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year} года`
    }

    return (
        <div className="profile">
            <div className="profile_info">
                <div className="profile_info_top">
                    <div className="profile_info_top_avatar">
                        <img src={user?.avatar ?? DefaultProfileAvatar} alt="img" />
                    </div>
                    <div className="profile_info_top_right_side">
                        <div></div>
                        <div className="profile_info_top_right_side_elements">
                            <p>{posts?.length ?? "0"} постов</p>
                            <button onClick={ () => { open_follows() } } className="app-transition">
                                <p>{user?.follows?.length ?? "0"} подписок</p>
                            </button>
                            <button onClick={ () => { open_followers() } } className="app-transition">
                                <p>{user?.followers?.length ?? "0"} подписчиков</p>
                            </button>
                        </div>
                        {profile && profile._id === user._id ? (
                            <button
                                className="profile_info_top_right_side_button profile_info_top_right_side_button_quit app-transition"
                                onClick={quitButtonClick}
                            >
                                Выйти
                            </button>
                        ) 
                        :
                            <FollowButton setNewData={setNewData} author_id={user?._id} class_name={"profile_info_top_right_side_button"}/> 
                        }
                    </div>
                </div>
                <div className="profile_info_bottom">
                    <div className="profile_info_bottom_nick">
                        <p
                            className={
                                "profile_info_bottom_nick_name" +
                                (user && user.is_admin ? " profile_info_bottom_nick_name_admin" : "")
                            }
                        >
                            {user.nick_name}
                        </p>
                        {user && user.is_verified ? <Verified className="profile_info_bottom_nick_verified" /> : null}
                    </div>
                    <div className="profile_info_bottom_administrator">
                        {
                            user?.is_admin ? 
                                <p>Administrator</p>
                            :
                                <></>
                        }
                    </div>
                    {user?.description && (
                        <div className="profile_info_bottom_description">
                            <p>{user.description}</p>
                        </div>
                    )}
                    <div className="profile_info_bottom_registration_date">
                        <Calendar className="app-transition" />
                        <p>Регистрация: {format_date(user.created_date)}.</p>
                    </div>
                </div>
            </div>
            <div className="profile_tab_list app-transition">
                {tabs.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => handleTabClick(item)}
                        className={`${
                            activeTab === item ? "profile_tab_list_active" : ""
                        } ${item === "Сохранённые" && (!profile || profile._id !== user._id) ? "not_allowed" : ""}`}
                    >
                        <p>{item}</p>
                    </div>
                ))}
            </div>
            <div className="profile_posts">
                <Posts posts_filters={[]} posts={activePosts} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default Profile;