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
import RedirectIcon from "../../assets/svg/redirect.svg?react";

import SwitchBar from "../Ui/SwitchBar";
import CurrentUserBadge from "../CurrentUserBadge/index";
import { isAdminRole } from "../AccountMenu/getAccountMenuBody";
import { isPathActive, navigateOrScrollTop } from "../../utils/navigation.js";

const MobileNavigationBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile } = useContext(AppContext);

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
    const isAdmin = isAdminRole(profile?.role);
    const onAdminPanel = location.pathname.startsWith("/admin-panel");

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

        const admin = {
            id: "admin",
            path: "/admin-panel",
            node: <RedirectIcon />,
            onClick: () => {
                if (onAdminPanel) {
                    navigateOrScrollTop(navigate, location.pathname, "/posts");
                    return;
                }

                navigate("/admin-panel?tab=dashboard");
            },
        };

        const profileSlot = profile
            ? {
                id: "profile",
                path: `/users/${profile.nick_name}`,
                extraPaths: ["/settings", "/support/mine"],
                node: <CurrentUserBadge asLink={false} avatarOnly />,
                onClick: () =>
                    navigateOrScrollTop(navigate, location.pathname, `/users/${profile.nick_name}`),
            }
            : {
                id: "login",
                path: "/auth/login",
                extraPaths: ["/auth/register"],
                node: <CurrentUserBadge asLink={false} avatarOnly />,
                onClick: () => navigate("/auth/login"),
            };

        const left = [home, search];

        if (profile) {
            left.push(notifications, messages);
        }

        const right = [];

        if (canCreate) {
            right.push(create);
        }

        if (isAdmin) {
            right.push(admin);
        }

        right.push(profileSlot);

        return [...left, ...right];
    }, [
        profile,
        navigate,
        hasUnread,
        unreadMessages,
        canCreate,
        isAdmin,
        onAdminPanel,
        location,
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
