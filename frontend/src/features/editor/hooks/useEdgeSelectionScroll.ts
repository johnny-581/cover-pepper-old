import { useEffect } from "react";
import type * as monacoNS from "monaco-editor";

/**
 * Smoothly auto-scrolls an outer container while mouse-drag-selecting text in Monaco.
 * Works even when pointer leaves the editor DOM.
 */
export const useEdgeSelectionScroll = (
    editor: monacoNS.editor.IStandaloneCodeEditor | null,
    monaco: typeof import("monaco-editor"),
    scrollContainerRef?: React.RefObject<HTMLElement | null>,
    options?: {
        edgeBand?: number;
        maxSpeedPxPerSec?: number;
        minActivate?: number;
        easeExp?: number;
    }
) => {
    useEffect(() => {
        if (!editor || !monaco) return;

        const EDGE_BAND = options?.edgeBand ?? 64;
        const MAX_SPEED_PX_PER_SEC = options?.maxSpeedPxPerSec ?? 1400;
        const MIN_ACTIVATE = options?.minActivate ?? 0.06;
        const EASE_EXP = options?.easeExp ?? 2.2;

        const scrollParent: HTMLElement | null =
            scrollContainerRef?.current ?? (document.scrollingElement as HTMLElement | null);
        const editorNode = editor.getDomNode() as HTMLElement | null;
        if (!scrollParent || !editorNode) return;

        let isMouseDown = false;
        let rafId: number | null = null;
        let lastClientX = 0;
        let lastClientY = 0;
        let anchor = editor.getPosition();
        let lastTs: number | null = null;

        const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

        const extendSelectionAt = (clientX: number, clientY: number) => {
            const rect = editorNode.getBoundingClientRect();
            const x = clamp(clientX, rect.left + 1, rect.right - 1);
            const y = clamp(clientY, rect.top + 1, rect.bottom - 1);

            const target = editor.getTargetAtClientPoint(x, y);
            if (!target || !target.position || !anchor) return;

            const pos = target.position;
            const Selection = monaco.Selection;
            editor.setSelection(
                new Selection(anchor.lineNumber, anchor.column, pos.lineNumber, pos.column)
            );
            editor.revealPositionInCenterIfOutsideViewport(pos);
        };

        const edgeState = (clientY: number, rect: DOMRect) => {
            if (clientY < rect.top + EDGE_BAND) {
                const d = rect.top + EDGE_BAND - clientY;
                return { dir: -1 as const, norm: Math.min(1, d / EDGE_BAND) };
            }
            if (clientY > rect.bottom - EDGE_BAND) {
                const d = clientY - (rect.bottom - EDGE_BAND);
                return { dir: +1 as const, norm: Math.min(1, d / EDGE_BAND) };
            }
            return { dir: 0 as const, norm: 0 };
        };

        const ease = (x: number) => (x <= MIN_ACTIVATE ? 0 : Math.pow(x, EASE_EXP));

        const tick = (ts?: number) => {
            rafId = null;
            const dt = lastTs == null ? 1 / 60 : Math.max(0, (ts! - lastTs) / 1000);
            lastTs = ts ?? lastTs;

            const rect = scrollParent.getBoundingClientRect();
            const { dir, norm } = edgeState(lastClientY, rect);

            if (isMouseDown) {
                if (dir !== 0 && norm > 0) {
                    const speed = ease(norm) * MAX_SPEED_PX_PER_SEC;
                    let dy = dir * speed * dt;

                    const maxUp = scrollParent.scrollTop;
                    const maxDown =
                        scrollParent.scrollHeight - scrollParent.clientHeight - scrollParent.scrollTop;
                    if (dy < 0) dy = -Math.min(Math.abs(dy), maxUp);
                    if (dy > 0) dy = Math.min(dy, maxDown);

                    if (dy !== 0) scrollParent.scrollBy(0, dy);
                }

                extendSelectionAt(lastClientX, lastClientY);
                rafId = requestAnimationFrame(tick);
            } else {
                lastTs = null;
            }
        };

        const start = () => {
            if (rafId == null) rafId = requestAnimationFrame(tick);
        };
        const stop = () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = null;
        };

        const downDisposable = editor.onMouseDown((e) => {
            if (!e.event.leftButton) return;
            isMouseDown = true;
            const sel = editor.getSelection();
            anchor = sel ? sel.getStartPosition() : editor.getPosition();
            start();
        });

        const onMouseUp = () => {
            isMouseDown = false;
            stop();
        };
        const onMouseMove = (e: MouseEvent) => {
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            if (isMouseDown && rafId == null) start();
        };

        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove, { passive: true });

        return () => {
            stop();
            downDisposable.dispose();
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("mousemove", onMouseMove);
        };
    }, [editor, monaco, scrollContainerRef, options?.edgeBand, options?.maxSpeedPxPerSec, options?.minActivate, options?.easeExp]);
};
