import { useEffect, useState } from "react";

export function useOverlayEnter(active = true) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!active) {
            setVisible(false);
            return;
        }

        setVisible(false);
        let innerFrame = 0;

        const outerFrame = requestAnimationFrame(() => {
            innerFrame = requestAnimationFrame(() => {
                setVisible(true);
            });
        });

        return () => {
            cancelAnimationFrame(outerFrame);
            cancelAnimationFrame(innerFrame);
        };
    }, [active]);

    return visible;
}
