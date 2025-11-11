import { useCallback, useState } from "react";
import type * as monacoNS from "monaco-editor";

/** Tracks editor content height so the OUTER container can scroll. */
export const useAutoHeight = () => {
    const [height, setHeight] = useState<number | string>("auto");

    const bind = useCallback((editor: monacoNS.editor.IStandaloneCodeEditor) => {
        const update = () => setHeight(editor.getContentHeight());
        update();
        const d1 = editor.onDidContentSizeChange(update);
        const d2 = editor.onDidChangeModelDecorations(() => {
            requestAnimationFrame(update);
        });
        return () => {
            d1.dispose();
            d2.dispose();
        };
    }, []);

    return { height, bind };
};
