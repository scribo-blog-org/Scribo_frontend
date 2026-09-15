import { useEffect, useMemo } from "react";
import {
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react";

import { useOverlayEnter } from "../../components/Ui/useOverlayEnter";

import "../../components/Ui/Popup/Popup.scss";

const PORTAL_ROOT = "app-layout";

const MessageContextMenu = ({ x, y, items, onClose }) => {
    const visible = useOverlayEnter(true);

    const virtualAnchor = useMemo(
        () => ({
            getBoundingClientRect: () => ({
                x,
                y,
                top: y,
                left: x,
                bottom: y,
                right: x,
                width: 0,
                height: 0,
            }),
        }),
        [x, y],
    );

    const { refs, floatingStyles } = useFloating({
        open: true,
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [offset(4), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
        elements: {
            reference: virtualAnchor,
        },
    });

    useEffect(() => {
        refs.setReference(virtualAnchor);
    }, [refs, virtualAnchor]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const onPointerDown = (event) => {
            if (event.target.closest(".popup_menu")) {
                return;
            }

            onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("mousedown", onPointerDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("mousedown", onPointerDown);
        };
    }, [onClose]);

    const portalRoot =
        typeof document === "undefined" ? null : document.getElementById(PORTAL_ROOT);

    if (!items.length) {
        return null;
    }

    return (
        <FloatingPortal root={portalRoot || undefined}>
            <div
                ref={refs.setFloating}
                className="popup_menu"
                style={floatingStyles}
                data-popup-placement="bottom-start"
            >
                <div
                    className={`popup_menu_surface float_section blurred${
                        visible ? " popup_menu_surface_visible" : ""
                    }`}
                >
                    <div className="popup_menu_section">
                        {items.map((item) => {
                            const Icon = item.icon;

                            return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={item.disabled}
                                className={`popup_menu_item app-transition${
                                    item.type === "danger" ? " popup_menu_item_danger" : ""
                                }`}
                                onClick={() => {
                                    if (item.disabled) {
                                        return;
                                    }

                                    item.onClick?.();
                                    onClose();
                                }}
                            >
                                <Icon />
                                <p className="popup_menu_item_title">{item.title}</p>
                            </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </FloatingPortal>
    );
};

export default MessageContextMenu;
