import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { AppContext } from "../App";
import { getProfile } from "../api/profile.api";
import { trackVisit } from "../api/analytics.api";
import {
    getAccessToken,
    getSocketToken,
    refreshAccessToken,
    subscribeAccessToken,
} from "../api/http";
import { socketService } from "../sockets/socket.service";
import AppBootScreen from "./AppBootScreen";

const SKIP_TRACKING = /^\/admin-panel/;
const SOCKET_WAIT_MS = 8000;

function waitWithTimeout(promise, ms) {
    return Promise.race([
        promise.catch(() => undefined),
        new Promise((resolve) => {
            setTimeout(resolve, ms);
        }),
    ]);
}

const SessionBootstrap = ({ children }) => {
    const location = useLocation();
    const { profile, setProfile, setProfileLoading } = useContext(AppContext);
    const [sessionReady, setSessionReady] = useState(false);
    const profileRef = useRef(profile);
    const requestIdRef = useRef(0);
    const bootstrappedRef = useRef(false);

    profileRef.current = profile;

    const loadSession = useCallback(async ({ blocking = false } = {}) => {
        const requestId = ++requestIdRef.current;

        if (!getAccessToken()) {
            setProfile(null);
            setProfileLoading(false);
            return;
        }

        const silent = Boolean(profileRef.current) && !blocking;

        if (!silent) {
            setProfileLoading(true);
        }

        try {
            const result = await getProfile();

            if (requestId !== requestIdRef.current || !getAccessToken()) {
                return;
            }

            if (result.status) {
                setProfile(result.data);
                profileRef.current = result.data;
                await waitWithTimeout(
                    socketService.init(result.data, getSocketToken()),
                    SOCKET_WAIT_MS
                );
            } else if (result.unauthorized) {
                setProfile(null);
                profileRef.current = null;
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setProfileLoading(false);
            }
        }
    }, [setProfile, setProfileLoading]);

    useEffect(() => {
        const unsubscribe = socketService.on("notification", (notifications) => {
            setProfile((prevProfile) => ({
                ...prevProfile,
                notifications,
            }));
        });

        return unsubscribe;
    }, [setProfile]);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                await refreshAccessToken();

                if (cancelled) {
                    return;
                }

                await loadSession({ blocking: true });
            } finally {
                if (!cancelled) {
                    bootstrappedRef.current = true;
                    setSessionReady(true);
                }
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, [loadSession]);

    useEffect(() => {
        return subscribeAccessToken((token) => {
            if (!bootstrappedRef.current) {
                return;
            }

            if (!token) {
                requestIdRef.current += 1;
                profileRef.current = null;
                setProfile(null);
                setProfileLoading(false);
                socketService.disconnect();
                setSessionReady(true);
                return;
            }

            if (profileRef.current) {
                loadSession({ blocking: false });
                return;
            }

            setSessionReady(false);
            setProfileLoading(true);

            loadSession({ blocking: true }).finally(() => {
                if (bootstrappedRef.current) {
                    setSessionReady(true);
                }
            });
        });
    }, [loadSession, setProfile, setProfileLoading]);

    useEffect(() => {
        if (!sessionReady) {
            return;
        }

        const path = location.pathname;

        if (!SKIP_TRACKING.test(path)) {
            trackVisit(path);
        }
    }, [sessionReady, location.pathname]);

    if (!sessionReady) {
        return <AppBootScreen />;
    }

    return children;
};

export default SessionBootstrap;
