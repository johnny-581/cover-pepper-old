import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useUpdateMutation } from "@/features/letters/hooks";
import { registerLatexLanguage } from "@/features/editor/latexLanguage";
import { defineCoverPepperTheme } from "@/features/editor/monaco-themes";
import { useAutosave } from "@/features/editor/hooks/useAutosave";
import { useAutoHeight } from "@/features/editor/hooks/useAutoHeight";
import { useEdgeSelectionScroll } from "@/features/editor/hooks/useEdgeSelectionScroll";
import type { MonacoEditorProps } from "@/features/editor/types";
import type * as monacoNS from "monaco-editor";

const BEGIN_DOC = "\\begin{document}";
const END_DOC = "\\end{document}";
const BODY_PLACEHOLDER = "% ... document body ...";

/**
 * Split a full LaTeX source into preamble, body, and whether the markers exist.
 */
function splitLatex(full: string) {
  const beginIdx = full.indexOf(BEGIN_DOC);
  const endIdx = full.indexOf(END_DOC);

  if (beginIdx === -1 || endIdx === -1) {
    // No document environment found – treat entire content as body
    return { preamble: "", body: full, hasDocumentEnv: false };
  }

  const preamble = full.slice(0, beginIdx).trimEnd();
  const body = full.slice(beginIdx + BEGIN_DOC.length, endIdx).trim();
  return { preamble, body, hasDocumentEnv: true };
}

/**
 * Reconstruct full LaTeX from parts.
 */
function joinLatex(preamble: string, body: string) {
  return `${preamble}\n${BEGIN_DOC}\n${body}\n${END_DOC}`;
}

export default function MonacoEditor({
  letter,
  scrollContainerRef,
  onSaveStatusChange,
  editingPreamble = false,
}: MonacoEditorProps) {
  const update = useUpdateMutation(letter.id);
  // Full LaTeX content is the source of truth
  const [fullLatex, setFullLatex] = useState(letter.contentLatex);
  const editorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoNS | null>(null);
  const prevLetterIdRef = useRef(letter.id);

  // Only reset local state when switching to a different letter.
  useEffect(() => {
    if (prevLetterIdRef.current !== letter.id) {
      prevLetterIdRef.current = letter.id;
      setFullLatex(letter.contentLatex);
    }
  }, [letter.id, letter.contentLatex]);

  // Derived parts from the full LaTeX
  const { preamble, body, hasDocumentEnv } = useMemo(
    () => splitLatex(fullLatex),
    [fullLatex]
  );

  // The text shown in the editor depends on the mode
  const displayValue = useMemo(() => {
    if (!hasDocumentEnv) return fullLatex;
    if (editingPreamble) {
      return `${preamble}\n${BEGIN_DOC}\n${BODY_PLACEHOLDER}\n${END_DOC}`;
    }
    return body;
  }, [editingPreamble, preamble, body, hasDocumentEnv, fullLatex]);

  // When switching modes, push the display value into the editor
  const prevEditingPreamble = useRef(editingPreamble);
  useEffect(() => {
    if (prevEditingPreamble.current !== editingPreamble && editorRef.current) {
      editorRef.current.setValue(displayValue);
    }
    prevEditingPreamble.current = editingPreamble;
  }, [editingPreamble, displayValue]);

  const onSave = useCallback(
    async (val: string) => {
      await update.mutateAsync({ contentLatex: val });
    },
    [update]
  );

  const { queueSave, flushNow, status } = useAutosave({
    onSave,
    delayMs: 800,
  });

  // Report save status changes to parent
  useEffect(() => {
    onSaveStatusChange?.(status);
  }, [status, onSaveStatusChange]);

  const { height, bind } = useAutoHeight();

  const onChange: OnChange = (v) => {
    const editorText = v ?? "";

    if (!hasDocumentEnv) {
      // No document environment – raw editing
      setFullLatex(editorText);
      queueSave(editorText);
      return;
    }

    let nextFull: string;
    if (editingPreamble) {
      // Extract the preamble portion from the editor text.
      // The editor shows: preamble + \begin{document} + placeholder + \end{document}
      const beginIdx = editorText.indexOf(BEGIN_DOC);
      if (beginIdx !== -1) {
        const newPreamble = editorText.slice(0, beginIdx).trimEnd();
        nextFull = joinLatex(newPreamble, body);
      } else {
        // User removed the \begin{document} tag – treat entire text as preamble
        nextFull = joinLatex(editorText.trimEnd(), body);
      }
    } else {
      // Body editing mode – reconstruct with existing preamble
      nextFull = joinLatex(preamble, editorText);
    }

    setFullLatex(nextFull);
    queueSave(nextFull);
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

    return () => {
      disposeAutoHeight();
      editorRef.current = null;
      monacoRef.current = null;
    };
  };

  // hook that wires edge scrolling once editor + monaco are available
  useEdgeSelectionScroll(
    editorRef.current,
    monacoRef.current as unknown as typeof import("monaco-editor"),
    scrollContainerRef,
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
        value={displayValue}
        onChange={onChange}
        onMount={onMount}
        options={{
          fontSize: 14,
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
          // Disable autocomplete/suggestions dropdown
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnCommitCharacter: false,
          acceptSuggestionOnEnter: "off",
          wordBasedSuggestions: "off",
          parameterHints: { enabled: false },
        }}
      />
    </div>
  );
}
