import { useEffect, useRef } from "react";

type Options = {
    onSave: (val: string) => Promise<void> | void;
    delayMs?: number; // default 800ms
};

/** Debounced autosave that also exposes an imperative "save now" function. */
export const useAutosave = ({ onSave, delayMs = 800 }: Options) => {
    const timer = useRef<NodeJS.Timeout | null>(null);
    const dirty = useRef(false);
    const latestValue = useRef<string>("");

    const queueSave = (value: string) => {
        latestValue.current = value;
        dirty.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            await onSave(latestValue.current);
            dirty.current = false;
            timer.current = null;
        }, delayMs);
    };

    const flushNow = async () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        if (dirty.current) {
            await onSave(latestValue.current);
            dirty.current = false;
        }
    };

    // warn on unload if dirty
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirty.current) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    return { queueSave, flushNow, dirty };
};
