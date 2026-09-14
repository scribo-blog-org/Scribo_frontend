import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

import { scrollToTop } from "../../utils/navigation.js";

const ScrollToTop = () => {
    const location = useLocation();

    useLayoutEffect(() => {
        scrollToTop();
    }, [location.pathname, location.key]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            scrollToTop();
        });

        return () => cancelAnimationFrame(frame);
    }, [location.pathname, location.key]);

    return null;
};

export default ScrollToTop;
