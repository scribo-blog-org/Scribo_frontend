import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react";

import { searchHashtags, searchUsers } from "../api/search.api";
import { applyMentionAtCursor, getActiveMention, stripLegacyMentionTokens } from "../content/mentions";
import { highlightPlainRichHtml } from "../content/plainRichText";
import { resolveComposerFeatures } from "../content/presets";
import { applyHashtagAtCursor, getActiveHashtag } from "../utils/hashtags";

export function useRichInputField({
    value,
    onChange,
    preset = "plain",
    features,
}) {
    const anchorRef = useRef(null);
    const textareaRef = useRef(null);
    const mirrorRef = useRef(null);
    const itemsRef = useRef([]);
    const activeIndexRef = useRef(0);
    const requestId = useRef(0);

    const [items, setItems] = useState([]);
    const [suggestKind, setSuggestKind] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const resolvedFeatures = useMemo(
        () => resolveComposerFeatures(preset, features),
        [features, preset],
    );

    const text = useMemo(() => stripLegacyMentionTokens(value ?? ""), [value]);

    const mirrorHtml = useMemo(
        () => highlightPlainRichHtml(text, resolvedFeatures),
        [resolvedFeatures, text],
    );

    const syncScroll = useCallback(() => {
        if (mirrorRef.current && textareaRef.current) {
            mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
            mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    useEffect(() => {
        syncScroll();
    }, [mirrorHtml, syncScroll, text]);

    itemsRef.current = items;
    activeIndexRef.current = activeIndex;

    const suggestOpen = items.length > 0;

    const { refs, floatingStyles } = useFloating({
        open: suggestOpen,
        placement: "top-start",
        strategy: "fixed",
        middleware: [offset(8), flip(), shift({ padding: 8 })],
        whileElementsMounted: suggestOpen ? autoUpdate : undefined,
    });

    useEffect(() => {
        if (anchorRef.current) {
            refs.setReference(anchorRef.current);
        }
    }, [refs, suggestOpen]);

    const refreshSuggest = useCallback(() => {
        const field = textareaRef.current;
        const current = field?.value ?? text ?? "";
        const caret =
            typeof field?.selectionStart === "number"
                ? field.selectionStart
                : current.length;

        if (resolvedFeatures.mentions) {
            const mention = getActiveMention(current, caret);
            if (mention) {
                const id = ++requestId.current;
                const query = mention.query;

                window.setTimeout(async () => {
                    if (id !== requestId.current) {
                        return;
                    }

                    const users = await searchUsers(query);
                    if (id !== requestId.current) {
                        return;
                    }

                    setSuggestKind("mention");
                    setActiveIndex(0);
                    setItems(users || []);
                }, 80);

                return;
            }
        }

        if (resolvedFeatures.hashtags) {
            const hashtag = getActiveHashtag(current, caret);
            if (hashtag) {
                const id = ++requestId.current;
                const token = hashtag.token;

                window.setTimeout(async () => {
                    if (id !== requestId.current) {
                        return;
                    }

                    const tags = await searchHashtags(token);
                    if (id !== requestId.current) {
                        return;
                    }

                    setSuggestKind("hashtag");
                    setActiveIndex(0);
                    setItems(tags || []);
                }, 80);

                return;
            }
        }

        setItems([]);
        setSuggestKind(null);
    }, [resolvedFeatures.hashtags, resolvedFeatures.mentions, text]);

    const applySelection = useCallback(
        (item) => {
            const field = textareaRef.current;
            if (!field) {
                return;
            }

            if (suggestKind === "mention") {
                const next = applyMentionAtCursor(
                    field.value,
                    field.selectionStart,
                    item,
                );
                onChange?.({ target: { value: next.text } });
                setItems([]);
                setSuggestKind(null);

                requestAnimationFrame(() => {
                    field.focus();
                    field.setSelectionRange(next.cursor, next.cursor);
                });

                return;
            }

            const next = applyHashtagAtCursor(field.value, field.selectionStart, item);
            onChange?.({ target: { value: next.text } });
            setItems([]);
            setSuggestKind(null);

            requestAnimationFrame(() => {
                field.focus();
                field.setSelectionRange(next.cursor, next.cursor);
            });
        },
        [onChange, suggestKind],
    );

    const handleChange = useCallback(
        (event) => {
            onChange?.(event);
        },
        [onChange],
    );

    const handleKeyDown = useCallback(
        (event) => {
            if (!items.length) {
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => (index + 1) % itemsRef.current.length);
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex(
                    (index) =>
                        (index - 1 + itemsRef.current.length) % itemsRef.current.length,
                );
                return;
            }

            if (
                (event.key === "Enter" || event.key === "Tab") &&
                itemsRef.current[activeIndexRef.current]
            ) {
                event.preventDefault();
                applySelection(itemsRef.current[activeIndexRef.current]);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                setItems([]);
                setSuggestKind(null);
            }
        },
        [applySelection, items.length],
    );

    const dismissSuggest = useCallback(() => {
        setItems([]);
        setSuggestKind(null);
    }, []);

    return {
        anchorRef,
        textareaRef,
        mirrorRef,
        mirrorHtml,
        syncScroll,
        refs,
        floatingStyles,
        text,
        items,
        suggestKind,
        activeIndex,
        resolvedFeatures,
        refreshSuggest,
        handleChange,
        handleKeyDown,
        dismissSuggest,
        applySelection,
        suggestOpen,
    };
}
