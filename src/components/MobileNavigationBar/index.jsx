import "./MobileNavigationBar.scss";

import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppContext } from "../../App";
import { getUnreadCount } from "../../api/chat.api";
import { socketService } from "../../sockets/socket.service";

import HomeIcon from "../../assets/svg/home-icon.svg?react";
import SearchIcon from "../../assets/svg/search.svg?react";
import NotificationsIcon from "../../assets/svg/notification.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import PlusIcon from "../../assets/svg/plus-icon.svg?react";
import DefaultProfileAvatar from "../../assets/images/default-profile-avatar.png";

import { logout } from "../../api/auth.api";

import SwitchBar from "../Ui/SwitchBar";
import Popup from "../Ui/Popup";
import CurrentUserBadge from "../CurrentUserBadge/index";
import { getAccountMenuBody } from "../AccountMenu/getAccountMenuBody";
import { isPathActive, navigateOrScrollTop } from "../../utils/navigation.js";

const MobileNavigationBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, setProfile, showToast } = useContext(AppContext);

    const [unreadMessages, setUnreadMessages] = useState(0);
    const hasUnread = Boolean(profile?.notifications?.some((item) => item.is_read === false));

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

    const canCreate = Boolean(profile?.permissions?.includes("create_post"));

    const slots = useMemo(() => {
        const home = {
            id: "home",
            path: "/posts",
            node: <HomeIcon />,
            onClick: () => navigateOrScrollTop(navigate, location.pathname, "/posts"),
        };

        const search = {
            id: "search",
            path: "/search",
            node: <SearchIcon />,
            onClick: () => navigateOrScrollTop(navigate, location.pathname, "/search"),
        };

        const notifications = {
            id: "notifications",
            path: "/notifications",
            node: (
                <>
                    {hasUnread ? (
                        <span className="navigation_bar_badge">
                            <span className="navigation_bar_badge_dot" />
                        </span>
                    ) : null}
                    <NotificationsIcon />
                </>
            ),
            onClick: () => navigateOrScrollTop(navigate, location.pathname, "/notifications"),
        };

        const messages = {
            id: "messages",
            path: "/messages",
            node: (
                <>
                    {unreadMessages > 0 ? (
                        <span className="navigation_bar_count_badge">
                            {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                    ) : null}
                    <CommentIcon />
                </>
            ),
            onClick: () => navigateOrScrollTop(navigate, location.pathname, "/messages"),
        };

        const create = {
            id: "create",
            path: "/create-post",
            node: <PlusIcon />,
            onClick: () => navigate("/create-post"),
        };

        const profileSlot = profile
            ? {
                id: "profile",
                extraPaths: [`/users/${profile.nick_name}`, "/settings", "/support/mine", "/admin-panel"],
                node: (
                    <Popup
                        body={getAccountMenuBody({
                            profile,
                            location,
                            navigate,
                            setProfile,
                            showToast,
                            logout,
                        })}
                    >
                        <CurrentUserBadge asLink={false} avatarOnly />
                    </Popup>
                ),
            }
            : {
                id: "login",
                path: "/auth/login",
                extraPaths: ["/auth/register"],
                node: (
                    <img
                        src={DefaultProfileAvatar}
                        alt=""
                        className="navigation_bar_avatar"
                    />
                ),
                onClick: () => navigate("/auth/login"),
            };

        const left = [home, search];

        if (profile) {
            left.push(notifications, messages);
        }

        if (canCreate) {
            return [...left, create, profileSlot];
        }

        return [...left, profileSlot];
    }, [
        profile,
        navigate,
        hasUnread,
        unreadMessages,
        canCreate,
        location,
        setProfile,
        showToast,
    ]);

    const isSlotActive = (item) => {
        if (isPathActive(location.pathname, item.path)) {
            return true;
        }

        return Boolean(item.extraPaths?.some((path) => isPathActive(location.pathname, path)));
    };

    const activeIndex = slots.findIndex((item) => isSlotActive(item));

    return (
        <nav className={`navigation_bar ${slots.length >= 5 ? "navigation_bar_compact" : ""}`}>
            <SwitchBar
                className="float_section blurred"
                items={slots.map((item) => item.node)}
                activeIndex={activeIndex}
                setActiveIndex={(index) => {
                    slots[index]?.onClick?.();
                }}
            />
        </nav>
    );
}

export default MobileNavigationBar;
