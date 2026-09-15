import { useEffect, useMemo, useState } from "react";

import { getUsersByIds } from "../api/users.api";
import { extractMentionUserIds } from "../content/mentions";

export function useMentionUserMap(userIds) {
    const idsKey = Array.isArray(userIds) ? userIds.join(",") : "";
    const ids = useMemo(
        () => [...new Set((userIds || []).map(String).filter(Boolean))],
        [idsKey, userIds],
    );
    const [userMap, setUserMap] = useState({});

    useEffect(() => {
        let cancelled = false;

        if (!ids.length) {
            setUserMap({});
            return undefined;
        }

        getUsersByIds(ids).then((users) => {
            if (cancelled) {
                return;
            }

            const map = {};
            for (const user of users) {
                if (user?._id) {
                    map[String(user._id)] = user;
                }
            }
            setUserMap(map);
        });

        return () => {
            cancelled = true;
        };
    }, [ids]);

    return userMap;
}

export function useMentionUsers(text, extraUsers) {
    const ids = useMemo(() => extractMentionUserIds(text), [text]);
    const extraIds = useMemo(
        () =>
            (extraUsers || [])
                .map((user) => String(user?._id || ""))
                .filter(Boolean)
                .join(","),
        [extraUsers],
    );
    const [userMap, setUserMap] = useState({});

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const map = {};

            if (!ids.length && !extraIds) {
                setUserMap({});
                return undefined;
            }

            for (const user of extraUsers || []) {
                if (user?._id) {
                    map[String(user._id)] = user;
                }
            }

            const missing = ids.filter((id) => !map[id]);
            if (missing.length) {
                const users = await getUsersByIds(missing);
                for (const user of users) {
                    if (user?._id) {
                        map[String(user._id)] = user;
                    }
                }
            }

            if (!cancelled) {
                setUserMap(map);
            }
        };

        if (!ids.length && !extraUsers?.length) {
            setUserMap({});
            return undefined;
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [extraIds, extraUsers, ids]);

    return userMap;
}
