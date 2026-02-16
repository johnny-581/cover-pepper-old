import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  onSave: (val: string) => Promise<void> | void;
  delayMs?: number; // default 800ms
};

export type SaveStatus = "idle" | "pending" | "saving" | "saved";

/** Debounced autosave that also exposes an imperative "save now" function. */
export const useAutosave = ({ onSave, delayMs = 800 }: Options) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const latestValue = useRef<string>("");
  const saving = useRef(false);
  const [status, setStatus] = useState<SaveStatus>("idle");

  // Keep a stable ref to the latest onSave so the timer closure never goes stale
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const doSave = useCallback(async () => {
    if (saving.current) return; // prevent overlapping saves
    saving.current = true;
    setStatus("saving");
    try {
      await onSaveRef.current(latestValue.current);
      dirty.current = false;
      setStatus("saved");
      // Auto-transition to idle after showing "saved" briefly
      setTimeout(() => setStatus("idle"), 1200);
    } finally {
      saving.current = false;
    }
  }, []);

  const queueSave = useCallback(
    (value: string) => {
      latestValue.current = value;
      dirty.current = true;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        doSave();
        timer.current = null;
      }, delayMs);
    },
    [delayMs, doSave]
  );

  const flushNow = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (dirty.current) {
      await doSave();
    }
  }, [doSave]);

  // Flush pending save on unmount so edits aren't lost
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (dirty.current) {
        onSaveRef.current(latestValue.current);
      }
    };
  }, []);

  // Warn on unload if dirty
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

  return { queueSave, flushNow, dirty, status };
};
