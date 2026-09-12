import "./AppLayout.scss";

import { useContext, useEffect, useCallback, useRef } from "react";
import { AppContext } from "../../App";
import { useLocation } from "react-router-dom";

import { getProfile } from "../../api/profile.api";
import { trackVisit } from "../../api/analytics.api";
import { getAccessToken, getSocketToken, subscribeAccessToken } from "../../api/http";
import { socketService } from "../../sockets/socket.service";

const SKIP_TRACKING = /^\/admin-panel/;

const AppLayout = ({ children }) => {
    const location = useLocation();
    const { profile, setProfile, setProfileLoading, authReady } = useContext(AppContext);
    const profileRef = useRef(profile);
    const requestIdRef = useRef(0);

    profileRef.current = profile;

    const setProfileData = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        if (!getAccessToken()) {
            setProfile(null);
            setProfileLoading(false);
            return;
        }

        const silent = Boolean(profileRef.current);

        if (!silent) {
            setProfileLoading(true);
        }

        const result = await getProfile();
        
        if (requestId !== requestIdRef.current || !getAccessToken()) {
            return;
        }
        if (result.status) {
            setProfile(result.data);
            socketService.init(result.data, getSocketToken());
        } else if (result.unauthorized) {
            setProfile(null);
        }

        setProfileLoading(false);
    }, [setProfile, setProfileLoading]);

    useEffect(() => {
        const unsubscribe = socketService.on(
            "notification",
            (notifications) => {
                setProfile((prevProfile) => ({
                    ...prevProfile,
                    notifications,
                }));
            }
        );

        return unsubscribe;
    }, []);

    useEffect(() => {
        return subscribeAccessToken((token) => {
            if (!token) {
                requestIdRef.current += 1;
                profileRef.current = null;
                setProfile(null);
                setProfileLoading(false);
                socketService.disconnect();
            }
        });
    }, [setProfile, setProfileLoading]);

    useEffect(() => {
        if (!authReady) {
            return;
        }

        document.body.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        const path = location.pathname;
        setProfileData();

        if (!SKIP_TRACKING.test(path)) {
            trackVisit(path);
        }
    }, [setProfileData, authReady]);

    return (
        <div className="app-layout app-transition" id="app-layout">
            {children}
        </div>
    );
};

export default AppLayout;