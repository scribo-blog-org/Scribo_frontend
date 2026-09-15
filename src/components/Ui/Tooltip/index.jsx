import { useState } from "react";
import {
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
    useHover,
    useInteractions,
    useRole,
    useTransitionStyles,
    safePolygon,
} from "@floating-ui/react";

import "./Tooltip.scss";

const PORTAL_ROOT = "app-layout";

const getSlideTransform = (side) =>
    side === "bottom" ? "translateY(-4px)" : "translateY(4px)";

const Tooltip = ({ text, children, className, clickable = false }) => {
    const [open, setOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: "top",
        strategy: "fixed",
        middleware: [offset(8), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
        duration: 200,
        initial: ({ side }) => ({
            opacity: 0,
            transform: getSlideTransform(side),
        }),
        open: {
            opacity: 1,
            transform: "translateY(0)",
        },
        close: ({ side }) => ({
            opacity: 0,
            transform: getSlideTransform(side),
        }),
    });

    const hover = useHover(context, {
        handleClose: safePolygon({ buffer: 4 }),
        delay: { open: 80, close: 0 },
    });
    const role = useRole(context, { role: "tooltip" });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, role]);

    const portalRoot =
        typeof document === "undefined"
            ? null
            : document.getElementById(PORTAL_ROOT);

    return (
        <>
            <span
                className={`tooltip_wrapper ${className || ""} ${clickable ? "clickable" : ""}`}
                ref={refs.setReference}
                {...getReferenceProps()}
            >
                {children}
            </span>
            {isMounted ? (
                <FloatingPortal root={portalRoot ?? undefined}>
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        className="tooltip_shell"
                        {...getFloatingProps()}
                    >
                        <div className="tooltip" style={transitionStyles}>
                            <p className="tooltip_text">{text}</p>
                        </div>
                    </div>
                </FloatingPortal>
            ) : null}
        </>
    );
};

export default Tooltip;
