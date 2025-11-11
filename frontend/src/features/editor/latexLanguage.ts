import type * as monacoNS from "monaco-editor";

export const registerLatexLanguage = (monaco: typeof monacoNS) => {
    monaco.languages.register({ id: "latex" });
    monaco.languages.setMonarchTokensProvider("latex", {
        tokenizer: {
            root: [
                [/((?:^|[^\\])(?:\\\\)*)(%.*$)/, "comment"],
                [/\\[a-zA-Z@]+/, "keyword"],
                [/[{}[\]()]/, "@brackets"],
                [/\$[^$]*\$/, "string"], // inline math
            ],
        },
    });
};
