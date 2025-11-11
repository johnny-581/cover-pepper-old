import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useUpdateMutation } from "@/features/letters/hooks";
import { registerLatexLanguage } from "@/features/editor/latexLanguage";
import { defineCoverPepperTheme } from "@/features/editor/monaco-themes";
import { useAutosave } from "@/features/editor/hooks/useAutosave";
import { useAutoHeight } from "@/features/editor/hooks/useAutoHeight";
import { useEdgeSelectionScroll } from "@/features/editor/hooks/useEdgeSelectionScroll";
import type { MonacoEditorProps } from "@/features/editor/types";
import type * as monacoNS from "monaco-editor";

export default function MonacoEditor({ letter, scrollContainerRef }: MonacoEditorProps) {
    const update = useUpdateMutation(letter.id);
    const [value, setValue] = useState(letter.contentLatex);
    const editorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof monacoNS | null>(null);

    // Sync external letter -> local state
    useEffect(() => {
        setValue(letter.contentLatex);
        // Reset autosave dirty state by re-queuing same value (no-op save)
        // or you could expose a reset method in useAutosave. Here it's fine as-is.
    }, [letter.id, letter.contentLatex]);

    const { queueSave, flushNow } = useAutosave({
        onSave: async (val) => {
            await update.mutateAsync({ contentLatex: val });
        },
        delayMs: 800,
    });

    const { height, bind } = useAutoHeight();

    const onChange: OnChange = (v) => {
        const next = v ?? "";
        setValue(next);
        queueSave(next);
    };

    const onMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        registerLatexLanguage(monaco);
        defineCoverPepperTheme(monaco);

        // auto-height bind
        const disposeAutoHeight = bind(editor);

        // Cmd/Ctrl+S to save immediately
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            await flushNow();
        });

        // enable edge selection scroll
        // (runs in an effect; we just ensure refs are set)
        return () => {
            disposeAutoHeight();
            editorRef.current = null;
            monacoRef.current = null;
        };
    };

    // hook that wires edge scrolling once editor + monaco are available
    useEdgeSelectionScroll(
        editorRef.current,
        // non-null assertion because hook only runs when set in effect; guarded in hook
        (monacoRef.current as unknown as typeof import("monaco-editor")),
        scrollContainerRef,
        // optional tuning knobs:
        {
            edgeBand: 72,
            maxSpeedPxPerSec: 1500,
            minActivate: 0.06,
            easeExp: 2.2,
        }
    );

    return (
        <div style={{ height }}>
            <Editor
                height="100%"
                language="latex"
                theme="coverPepperLatex"
                value={value}
                onChange={onChange}
                onMount={onMount}
                options={{
                    fontSize: 14,
                    // lineNumbers: "on",
                    // selectOnLineNumbers: true,
                    // glyphMargin: false,
                    // folding: false,
                    // lineDecorationsWidth: 0,
                    // lineNumbersMinChars: 3,
                    // cursorSurroundingLines: 0,
                    guides: { indentation: false },
                    minimap: { enabled: false },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 24, bottom: 24 },
                    automaticLayout: true,
                    scrollbar: {
                        vertical: "hidden",
                        alwaysConsumeMouseWheel: false,
                    },
                    overviewRulerLanes: 0,
                }}
            />
        </div>
    );
}
