import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    FloatingPortal,
    FloatingTree,
    FloatingNode,
    useFloatingNodeId,
    useHover,
    useInteractions,
    safePolygon,
} from "@floating-ui/react";
import "./Popup.scss";

import ChevronRightIcon from "../../../assets/svg/chevron-right.svg?react";
import { useOverlayEnter } from "../useOverlayEnter";

const MENU_ROOT_DEFAULT = "app-layout";

function resolveLayer(explicitLayer, anchorEl) {
    if (explicitLayer === "header" || explicitLayer === "content") {
        return explicitLayer;
    }

    return anchorEl?.closest(".header") ? "header" : "content";
}

function popupLayerClass(layer, nested = false) {
    const classes = ["popup_menu"];

    if (layer === "header") {
        classes.push("popup_menu_header");
    }

    if (nested) {
        classes.push("popup_menu_nested");
    }

    return classes.join(" ");
}

function popupMenuShellProps({ layer, nested = false, placement }) {
    return {
        className: popupLayerClass(layer, nested),
        "data-popup-placement": placement,
    };
}

function PopupMenuSurface({ visible, children }) {
    return (
        <div className={`popup_menu_surface float_section blurred${visible ? " popup_menu_surface_visible" : ""}`}>
            {children}
        </div>
    );
}

function normalizeSections(body) {
    if (!Array.isArray(body) || body.length === 0) {
        return [];
    }

    const sections = Array.isArray(body[0]) ? body : [body];

    return sections
        .map((section) => (Array.isArray(section) ? section.filter(Boolean) : []))
        .filter((section) => section.length > 0);
}

function canHoverFinePointer() {
    return typeof window !== "undefined"
        && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function findActiveItem(sections) {
    for (const section of sections) {
        for (const item of section) {
            if (item.isActive) {
                return item;
            }
        }
    }

    return null;
}

function useFloatingPosition(refs, x, y) {
    useLayoutEffect(() => {
        setPopupPosition(refs.floating.current, x, y);
    }, [refs, x, y]);
}

function MenuItem({ item, onItemSelect, portalRootId, layer }) {
    if (item.type === "submenu" || item.type === "dropdown") {
        return (
            <FlyoutItem
                item={item}
                onItemSelect={onItemSelect}
                portalRootId={portalRootId}
                layer={layer}
            />
        );
    }

    return (
        <button
            type="button"
            className={`popup_menu_item app-transition ${item.className ?? ""} ${item.type === "danger" ? "popup_menu_item_danger" : ""} ${item.isActive ? "popup_menu_item_active" : ""}`}
            onClick={() => {
                if (!item.isActive) {
                    item.onClick?.();
                }
                onItemSelect();
            }}
        >
            {item.icon}
            <p className="popup_menu_item_title">
                {item.title}
            </p>
        </button>
    );
}

function MenuBody({ sections, onItemSelect, portalRootId, layer }) {
    return sections.map((section, sectionIndex) => (
        <Fragment key={sectionIndex}>
            {sectionIndex > 0 && <div className="popup_menu_separator" role="separator" />}
            <div className="popup_menu_section">
                {section.map((item, itemIndex) => (
                    <MenuItem
                        key={item.id ?? `${sectionIndex}-${itemIndex}`}
                        item={item}
                        onItemSelect={onItemSelect}
                        portalRootId={portalRootId}
                        layer={layer}
                    />
                ))}
            </div>
        </Fragment>
    ));
}

function FlyoutItem({ item, onItemSelect, portalRootId = MENU_ROOT_DEFAULT, layer = "content" }) {
    const nodeId = useFloatingNodeId();
    const [open, setOpen] = useState(false);
    const visible = useOverlayEnter(open);
    const sections = normalizeSections(item.items);
    const isDropdown = item.type === "dropdown";
    const valueLabel = item.valueLabel ?? findActiveItem(sections)?.title;

    const { refs, x, y, placement, context } = useFloating({
        nodeId,
        open,
        onOpenChange: setOpen,
        placement: "right-start",
        strategy: "fixed",
        middleware: [
            offset(6),
            flip({ fallbackPlacements: ["left-start", "right-end", "left-end"] }),
            shift({ padding: 8 }),
        ],
        whileElementsMounted: autoUpdate,
    });

    useFloatingPosition(refs, x, y);

    const hover = useHover(context, {
        handleClose: safePolygon({ buffer: 6 }),
        delay: { open: 40, close: 100 },
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    if (sections.length === 0) {
        return null;
    }

    return (
        <FloatingNode id={nodeId}>
            <button
                type="button"
                ref={refs.setReference}
                className={`popup_menu_item popup_menu_item_flyout app-transition ${isDropdown ? "popup_menu_item_dropdown" : ""} ${item.className ?? ""}`}
                {...getReferenceProps({
                    onClick: (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!canHoverFinePointer()) {
                            setOpen((current) => !current);
                        }
                    },
                })}
            >
                {item.icon}
                <p className="popup_menu_item_title">
                    {item.title}
                </p>
                {isDropdown && valueLabel ? (
                    <p className="popup_menu_item_value">{valueLabel}</p>
                ) : null}
                <ChevronRightIcon className="popup_menu_item_chevron" />
            </button>

            {open && (
                <FloatingPortal root={document.getElementById(portalRootId)}>
                    <div
                        {...getFloatingProps({
                            ref: (node) => {
                                refs.setFloating(node);
                                setPopupPosition(node, x, y);
                            },
                            ...popupMenuShellProps({
                                layer,
                                nested: true,
                                placement,
                            }),
                        })}
                    >
                        <PopupMenuSurface visible={visible}>
                            <MenuBody
                                sections={sections}
                                onItemSelect={onItemSelect}
                                portalRootId={portalRootId}
                                layer={layer}
                            />
                        </PopupMenuSurface>
                    </div>
                </FloatingPortal>
            )}
        </FloatingNode>
    );
}

function setPopupPosition(node, x, y) {
    if (!node) {
        return;
    }

    node.style.setProperty("--popup-x", `${Math.round(x ?? 0)}px`);
    node.style.setProperty("--popup-y", `${Math.round(y ?? 0)}px`);
}

function PopupMenu({ anchorRef, children, onClose, portalRootId, layer }) {
    const visible = useOverlayEnter(true);
    const { refs, x, y, placement } = useFloating({
        elements: {
            reference: anchorRef.current,
        },
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [offset(8), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    useFloatingPosition(refs, x, y);

    useEffect(() => {
        function handleClick(event) {
            if (
                event.target.closest(".popup_menu") ||
                anchorRef.current?.contains(event.target)
            ) {
                return;
            }
            onClose();
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose, anchorRef]);

    return (
        <FloatingPortal root={document.getElementById(portalRootId)}>
            <div
                ref={(node) => {
                    refs.setFloating(node);
                    setPopupPosition(node, x, y);
                }}
                {...popupMenuShellProps({ layer, placement })}
            >
                <PopupMenuSurface visible={visible}>
                    {children}
                </PopupMenuSurface>
            </div>
        </FloatingPortal>
    );
}

function Popup({ children, body, className, portalRootId = MENU_ROOT_DEFAULT, layer }) {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [activeLayer, setActiveLayer] = useState("content");
    const sections = normalizeSections(body);

    const handleToggle = () => {
        setOpen((current) => {
            if (!current) {
                setActiveLayer(resolveLayer(layer, buttonRef.current));
            }

            return !current;
        });
    };

    return (
        <div className="popup">
            <div
                className={`popup_trigger ${className || ""}`}
                ref={buttonRef}
                onClick={handleToggle}
            >
                {children}
            </div>

            {open && sections.length > 0 && (
                <FloatingTree>
                    <PopupMenu
                        anchorRef={buttonRef}
                        onClose={() => setOpen(false)}
                        portalRootId={portalRootId}
                        layer={activeLayer}
                    >
                        <MenuBody
                            sections={sections}
                            onItemSelect={() => setOpen(false)}
                            portalRootId={portalRootId}
                            layer={activeLayer}
                        />
                    </PopupMenu>
                </FloatingTree>
            )}
        </div>
    );
}

export default Popup;
