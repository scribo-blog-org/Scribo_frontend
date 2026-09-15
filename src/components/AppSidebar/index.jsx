import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AppContext } from "../../App";
import { getUnreadCount } from "../../api/chat.api";
import { socketService } from "../../sockets/socket.service";
import { isAdminRole } from "../AccountMenu/getAccountMenuBody";
import { handleSameRouteClick, isPathActive } from "../../utils/navigation.js";

import PrimaryButton from "../Ui/PrimaryButton/index";

import MainLogo from "../../assets/svg/full-logo-icon.svg?react";
import HomeIcon from "../../assets/svg/home-icon.svg?react";
import SearchIcon from "../../assets/svg/search.svg?react";
import ProfileIcon from "../../assets/svg/profile.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import NotificationIcon from "../../assets/svg/notification.svg?react";
import PlusIcon from "../../assets/svg/plus-icon.svg?react";
import RedirectIcon from "../../assets/svg/redirect.svg?react";
import SettingsIcon from "../../assets/svg/settings.svg?react";
import InfoIcon from "../../assets/svg/info.svg?react";

import "./AppSidebar.scss";

function AppSidebar() {
    const { profile } = useContext(AppContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = useState(0);

    const hasUnreadNotifications = Boolean(
        profile?.notifications?.some((item) => item.is_read === false)
    );
    const canCreate = Boolean(profile?.permissions?.includes("create_post"));
    const isAdmin = isAdminRole(profile?.role);
    const onAdminPanel = location.pathname.startsWith("/admin-panel");

    useEffect(() => {
        if (!profile) {
            setUnreadMessages(0);
            return;
        }

        let cancelled = false;

        getUnreadCount().then((result) => {
            if (!cancelled && result?.status) {
                setUnreadMessages(result.data?.unread || 0);
            }
        });

        const unsubscribe = socketService.on("chat:unread", (unread) => {
            setUnreadMessages(Number(unread) || 0);
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [profile?._id]);

    const navClass = (path, extraPaths = []) => {
        const active =
            isPathActive(location.pathname, path) ||
            extraPaths.some((item) => isPathActive(location.pathname, item));

        return `app-sidebar_item app-transition${active ? " app-sidebar_item_active" : ""}`;
    };

    return (
        <aside className="app-sidebar app-transition" aria-label="Навигация">
            <Link
                to="/posts"
                className="app-sidebar_logo app-transition"
                onClick={(event) => handleSameRouteClick(event, location.pathname, "/posts")}
            >
                <MainLogo className="app-sidebar_logo_icon" />
            </Link>

            <nav className="app-sidebar_nav">
                <Link
                    to="/posts"
                    className={navClass("/posts")}
                    onClick={(event) => handleSameRouteClick(event, location.pathname, "/posts")}
                >
                    <HomeIcon className="app-sidebar_item_icon" />
                    <span>Главная</span>
                </Link>

                <Link
                    to="/search"
                    className={navClass("/search")}
                    onClick={(event) => handleSameRouteClick(event, location.pathname, "/search")}
                >
                    <SearchIcon className="app-sidebar_item_icon" />
                    <span>Поиск</span>
                </Link>

                {profile ? (
                    <>
                        <Link
                            to={`/users/${profile.nick_name}`}
                            className={navClass(`/users/${profile.nick_name}`)}
                            onClick={(event) =>
                                handleSameRouteClick(event, location.pathname, `/users/${profile.nick_name}`)
                            }
                        >
                            <ProfileIcon className="app-sidebar_item_icon" />
                            <span>Профиль</span>
                        </Link>

                        <Link
                            to="/messages"
                            className={navClass("/messages")}
                            onClick={(event) => handleSameRouteClick(event, location.pathname, "/messages")}
                        >
                            {unreadMessages > 0 ? (
                                <span className="app-sidebar_badge">
                                    {unreadMessages > 99 ? "99+" : unreadMessages}
                                </span>
                            ) : null}
                            <CommentIcon className="app-sidebar_item_icon" />
                            <span>Сообщения</span>
                        </Link>

                        <Link
                            to="/notifications"
                            className={navClass("/notifications")}
                            onClick={(event) =>
                                handleSameRouteClick(event, location.pathname, "/notifications")
                            }
                        >
                            {hasUnreadNotifications ? (
                                <span className="app-sidebar_dot" aria-hidden="true" />
                            ) : null}
                            <NotificationIcon className="app-sidebar_item_icon" />
                            <span>Уведомления</span>
                        </Link>

                        <Link
                            to="/support/mine"
                            className={navClass("/support/mine")}
                            onClick={(event) =>
                                handleSameRouteClick(event, location.pathname, "/support/mine")
                            }
                        >
                            <InfoIcon className="app-sidebar_item_icon" />
                            <span>Поддержка</span>
                        </Link>
                    </>
                ) : null}

                {canCreate ? (
                    <PrimaryButton
                        className="app-sidebar_create"
                        onClick={() => navigate("/create-post")}
                    >
                        <PlusIcon />
                        Создать пост
                    </PrimaryButton>
                ) : null}
            </nav>

            <div className="app-sidebar_footer">
                {isAdmin ? (
                    <button
                        type="button"
                        className={navClass(onAdminPanel ? "/posts" : "/admin-panel")}
                        onClick={() =>
                            navigate(
                                onAdminPanel ? "/posts" : "/admin-panel?tab=dashboard"
                            )
                        }
                    >
                        <RedirectIcon className="app-sidebar_item_icon" />
                        <span>{onAdminPanel ? "Домой" : "В админ панель"}</span>
                    </button>
                ) : null}

                {profile ? (
                    <Link
                        to="/settings"
                        className={navClass("/settings")}
                        onClick={(event) => handleSameRouteClick(event, location.pathname, "/settings")}
                    >
                        <SettingsIcon className="app-sidebar_item_icon" />
                        <span>Настройки</span>
                    </Link>
                ) : (
                    <PrimaryButton
                        className="app-sidebar_login"
                        onClick={() => navigate("/auth/login")}
                    >
                        Войти
                    </PrimaryButton>
                )}
            </div>
        </aside>
    );
}

export default AppSidebar;
