import "./SwitchBar.scss";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";

export default function SwitchBar({
    activeIndex,
    setActiveIndex,
    onChange,
    items,
    className = "",
}) {
    const selectIndex = onChange ?? setActiveIndex;
    const containerRef = useRef(null);
    const buttonsRef = useRef([]);

    const [indicator, setIndicator] = useState({
        left: 0,
        width: 0,
    });

    const updateIndicator = useCallback(() => {
        const button = buttonsRef.current[activeIndex];

        if (!button) {
            setIndicator({
                left: 0,
                width: 0,
            });
            return;
        }

        setIndicator({
            left: button.offsetLeft,
            width: button.offsetWidth,
        });

    }, [activeIndex]);

    useLayoutEffect(() => {
        updateIndicator();
    }, [activeIndex, items, updateIndicator]);

    useEffect(() => {
        window.addEventListener("resize", updateIndicator);

        const container = containerRef.current;
        const observer = container
            ? new ResizeObserver(() => {
                  updateIndicator();
              })
            : null;

        if (container && observer) {
            observer.observe(container);
        }

        return () => {
            window.removeEventListener("resize", updateIndicator);
            observer?.disconnect();
        };
    }, [updateIndicator]);

    return (
        <div
            ref={containerRef}
            className={`switcher_bar app-transition ${className}`}
        >
            <div
                className="switcher_bar_indicator"
                style={{
                    width: indicator.width,
                    transform: `translateX(${indicator.left}px)`,
                    opacity: indicator.width > 0 ? 1 : 0,
                }}
            />

            {items?.map((item, index) => (
                <button
                    key={index}
                    ref={(el) => (buttonsRef.current[index] = el)}
                    type="button"
                    className={`switcher_bar_item app-transition ${
                        activeIndex === index
                            ? "switcher_bar_item_active"
                            : ""
                    }`}
                    onClick={() => selectIndex?.(index)}
                >
                    {item}
                </button>
            ))}
        </div>
    );
}