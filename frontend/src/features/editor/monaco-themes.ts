import type * as monacoNS from "monaco-editor";

const cssVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const defineCoverPepperTheme = (monaco: typeof monacoNS) => {
    monaco.editor.defineTheme("coverPepperLatex", {
        base: "vs",
        inherit: true,
        rules: [
            { token: "comment", foreground: "6A9955" },
            { token: "keyword", foreground: "D3AA57" },
            { token: "string", foreground: "D16969" },
            { token: "brackets", foreground: "007ACC" },
            { token: "", foreground: cssVar("--color-almost-black") || "222222" },
        ],
        colors: {
            "editor.background": "#00000000",
            "editorGutter.background": "#00000000",
            "editorCursor.foreground": cssVar("--color-theme-black") || "#222222",
            "editor.selectionBackground": cssVar("--color-theme-primary") || "#CCE5FF55",
            "editor.focusedBorder": "#00000000",
            "editorWidget.border": "#00000000",
            "focusBorder": "#00000000",
            "editorLineNumber.foreground": cssVar("--color-gray"),
            "editorLineNumber.activeForeground": cssVar("--color-gray"),
            // visually hide line numbers
            // "editorLineNumber.foreground": "#00000000",
            // "editorLineNumber.activeForeground": "#00000000",
        },
    });

    monaco.editor.setTheme("coverPepperLatex");
};
