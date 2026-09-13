import { useState, useEffect } from "react";
import { format_back } from "../../utils/format.js";

const RelativeTime = ({ date, intervalMs = 1000 }) => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!date) return;

        const timer = setInterval(() => {
            forceUpdate(tick => tick + 1);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [date, intervalMs]);

    return <>{format_back(date)}</>;
};

export default RelativeTime;