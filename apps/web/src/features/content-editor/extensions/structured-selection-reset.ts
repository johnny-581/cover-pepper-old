import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { Slice } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import {
  analyzeStructuredSelection,
  type AnchorPath,
} from "../utils/analyze-structured-selection";

type DocumentMeta = {
  template: import("@pepper-apply/shared").Template;
  groupListLayouts: Record<string, import("@pepper-apply/shared").LayoutNode[]>;
};

export const StructuredSelectionReset = Extension.create({
  name: "structuredSelectionReset",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleKeyDown: (view, event) => {
            if (event.key !== "Backspace" && event.key !== "Delete") {
              return false;
            }

            return handleStructuredSelectionReset(view, getDocumentMeta(this.editor.storage));
          },
          handleTextInput: (view, _from, _to, text) => {
            return handleStructuredSelectionReset(
              view,
              getDocumentMeta(this.editor.storage),
              { type: "text", text },
            );
          },
          handlePaste: (view, event, slice) => {
            if (!(slice instanceof Slice)) {
              return false;
            }

            return handleStructuredSelectionReset(
              view,
              getDocumentMeta(this.editor.storage),
              { type: "slice", slice },
            );
          },
        },
      }),
    ];
  },
});

function handleStructuredSelectionReset(
  view: EditorView,
  meta: DocumentMeta | null,
  insertion?:
    | { type: "text"; text: string }
    | { type: "slice"; slice: Slice },
): boolean {
  if (!meta) return false;

  const analysis = analyzeStructuredSelection(view.state.doc, view.state.selection, meta.template);
  if (!analysis) return false;

  const nextDoc = view.state.schema.nodeFromJSON(analysis.doc);
  let tr = view.state.tr.replaceWith(0, view.state.doc.content.size, nextDoc.content);

  const anchorPos = clampSelectionPos(tr.doc.content.size, resolveAnchorPos(tr.doc, analysis.anchor));
  tr = tr.setSelection(TextSelection.create(tr.doc, anchorPos));

  if (insertion?.type === "text") {
    tr = tr.insertText(insertion.text);
  } else if (insertion?.type === "slice") {
    tr = tr.replaceSelection(insertion.slice);
  }

  view.dispatch(tr.scrollIntoView());
  return true;
}

function resolveAnchorPos(
  doc: PMNode,
  anchor: AnchorPath,
): number {
  let node = doc;
  let pos = 0;

  for (const index of anchor.path) {
    const contentStart = node.type.name === "doc" ? pos : pos + 1;
    let childOffset = 0;
    for (let childIndex = 0; childIndex < index; childIndex += 1) {
      childOffset += node.child(childIndex).nodeSize;
    }

    pos = contentStart + childOffset;
    node = node.child(index);
  }

  if (node.type.name !== "paragraph") {
    return 1;
  }

  return pos + 1 + Math.min(anchor.textOffset, node.content.size);
}

function clampSelectionPos(maxContentSize: number, pos: number): number {
  return Math.max(1, Math.min(pos, maxContentSize));
}

function getDocumentMeta(
  storage: unknown,
): DocumentMeta | null {
  if (!storage || typeof storage !== "object") return null;
  const meta = (storage as Record<string, unknown>).documentMeta;
  if (!meta || typeof meta !== "object") return null;
  return meta as DocumentMeta;
}
