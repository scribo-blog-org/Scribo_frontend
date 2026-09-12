import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { AppContext } from "../../App";
import { getUsers, read_notifications } from "../../api/users.api";
import { format_back, format_date_time } from "../../utils/format";

import UserBadge from "../../components/UserBadge/index";
import NotificationMessage from "../../components/NotificationMessage/index";
import Tooltip from "../../components/Ui/Tooltip/index";
import Loading from "../../components/Ui/Loading";

import "./Notifications.scss";

const Notifications = () => {
    const { profile, setProfile, profileLoading } = useContext(AppContext);
    const [userMap, setUserMap] = useState({});
    const [usersLoading, setUsersLoading] = useState(true);
    const [unreadIds, setUnreadIds] = useState(null);
    const markedRead = useRef(false);

    const items = useMemo(
        () => [...(profile?.notifications || [])].reverse(),
        [profile]
    );

    const actorKey = useMemo(
        () => items.map((item) => item.user).filter(Boolean).join(","),
        [items]
    );

    useEffect(() => {
        if (!profile || unreadIds) {
            return;
        }

        setUnreadIds(
            new Set(
                (profile.notifications || [])
                    .filter((item) => item.is_read === false)
                    .map((item) => item._id)
            )
        );
    }, [profile, unreadIds]);

    useEffect(() => {
        let cancelled = false;

        const loadActors = async () => {
            const userIds = [...new Set(actorKey.split(",").filter(Boolean))];

            if (userIds.length === 0) {
                if (!cancelled) {
                    setUserMap({});
                    setUsersLoading(false);
                }
                return;
            }

            setUsersLoading(true);
            const users = await getUsers(userIds.map((_id) => ({ _id })));

            if (cancelled) {
                return;
            }

            setUserMap(
                users?.data?.reduce((acc, user) => {
                    acc[user._id] = user;
                    return acc;
                }, {}) || {}
            );
            setUsersLoading(false);
        };

        if (profile) {
            loadActors();
        }

        return () => {
            cancelled = true;
        };
    }, [actorKey, profile]);

    useEffect(() => {
        if (!profile || markedRead.current) {
            return;
        }

        if (!profile.notifications?.some((item) => item.is_read === false)) {
            return;
        }

        markedRead.current = true;

        read_notifications().then((result) => {
            if (result.status === true) {
                setProfile((current) => {
                    if (!current) {
                        return current;
                    }

                    return {
                        ...current,
                        notifications: current.notifications.map((item) => ({
                            ...item,
                            is_read: true,
                        })),
                    };
                });
            }
        });
    }, [profile, setProfile]);

    if (profileLoading) {
        return <Loading size={40} />;
    }

    if (!profile) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div className="notifications_page">
            <div className="notifications_page_intro">
                <h1>Уведомления</h1>
                <p>Лайки, комментарии, подписки и ответы по запросам.</p>
            </div>

            <div className="notifications_page_list app-transition">
                {usersLoading ? (
                    <Loading size={40} />
                ) : items.length ? (
                    items.map((item) => {
                        const actor = userMap[item.user] || { nick_name: "Пользователь" };
                        const isUnread = Boolean(unreadIds?.has(item._id));

                        return (
                            <article
                                key={item.time}
                                className={`notifications_page_item app-transition ${isUnread ? "notifications_page_item_unread" : ""}`}
                            >
                                {
                                    isUnread && (
                                        <span className={`notifications_page_item_dot notifications_page_item_dot_on`} />
                                    )
                                }
                                <div className="notifications_page_item_body">
                                    <UserBadge
                                        data={actor}
                                        asLink={Boolean(userMap[item.user])}
                                    />
                                    <p className="notifications_page_item_message">
                                        <NotificationMessage item={item} />
                                    </p>
                                    <Tooltip text={format_date_time(item.time)}>
                                        <p className="notifications_page_item_time">{format_back(item.time)}</p>
                                    </Tooltip>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p className="notifications_page_empty">Пока нет уведомлений</p>
                )}
            </div>
        </div>
    );
};

export default Notifications;
