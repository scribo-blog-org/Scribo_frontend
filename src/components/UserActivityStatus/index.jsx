import { useEffect, useState } from "react";

import Clock from "../../assets/svg/clock.svg?react";
import RelativeTime from "../RelativeTime/index.jsx";
import Tooltip from "../Ui/Tooltip/index";
import { format_date_time } from "../../utils/format.js";
import { subscribeUserActivity } from "../../sockets/presence.supabase.js";

import "./UserActivityStatus.scss";

const UserActivityStatus = ({
    user,
    viewerId,
    isOnline: isOnlineProp,
    className = "",
}) => {
    const userId = user?._id;
    const [isOnlineLocal, setIsOnlineLocal] = useState(false);

    const isOwn =
        viewerId && userId && String(viewerId) === String(userId);
    const isActivityPublic = user?.is_last_activity_public !== false;
    const canShow = Boolean(userId) && (isOwn || isActivityPublic);

    const isOnline = isOnlineProp ?? isOnlineLocal;

    useEffect(() => {
        if (!canShow || isOnlineProp !== undefined) {
            return;
        }

        let cancelled = false;

        const unsubscribe = subscribeUserActivity(userId, (online) => {
            if (!cancelled) {
                setIsOnlineLocal(online);
            }
        });

        return () => {
            cancelled = true;
            void unsubscribe();
        };
    }, [userId, canShow, isOnlineProp]);

    if (!canShow) {
        return null;
    }

    if (isOnline) {
        return (
            <div className={`user_activity_status user_activity_status--online ${className}`.trim()}>
                <span className="user_activity_status_dot" aria-hidden="true" />
                <p>В сети</p>
            </div>
        );
    }

    if (user?.last_activity_at) {
        return (
            <div className={`user_activity_status ${className}`.trim()}>
                <Clock />
                <Tooltip text={format_date_time(user.last_activity_at)}>
                    <p><RelativeTime date={user.last_activity_at} /></p>
                </Tooltip>
            </div>
        );
    }

    return null;
};

export default UserActivityStatus;
