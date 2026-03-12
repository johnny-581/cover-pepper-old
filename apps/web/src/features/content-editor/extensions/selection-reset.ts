import { Extension } from "@tiptap/core";
import { Slice, type Node as PMNode } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import {
  analyzeSelection,
} from "../utils/selection/analyze-selection";
import {
  clampSelectionPos,
  type SelectionAnchor,
} from "../utils/selection/analyze-selection-helpers";

type DocumentMeta = {
  templateSpec: import("@pepper-apply/shared").TemplateSpec;
  templateLayout: import("@pepper-apply/shared").TemplateLayout;
  groupListLayouts: Record<string, import("@pepper-apply/shared").LayoutNode[]>;
};

type Insertion =
  | { type: "text"; text: string }
  | { type: "slice"; slice: Slice };

export const SelectionReset = Extension.create({
  name: "selectionReset",

  addProseMirrorPlugins() {
    const runReset = (view: EditorView, insertion?: Insertion): boolean => {
      return handleSelectionReset(
        view,
        getDocumentMeta(this.editor.storage),
        insertion,
      );
    };

    return [
      new Plugin({
        props: {
          handleKeyDown: (view, event) => {
            if (event.key !== "Backspace" && event.key !== "Delete") {
              return false;
            }

            return runReset(view);
          },
          handleTextInput: (view, _from, _to, text) => {
            return runReset(view, { type: "text", text });
          },
          handlePaste: (view, _event, slice) => {
            if (!(slice instanceof Slice)) {
              return false;
            }

            return runReset(view, { type: "slice", slice });
          },
        },
      }),
    ];
  },
});

function handleSelectionReset(
  view: EditorView,
  meta: DocumentMeta | null,
  insertion?: Insertion,
): boolean {
  if (!meta) return false;

  const analysis = analyzeSelection(
    view.state.doc,
    view.state.selection,
    meta.templateSpec,
    meta.templateLayout,
  );
  if (!analysis) return false;

  const nextDoc = view.state.schema.nodeFromJSON(analysis.doc);
  let tr = view.state.tr.replaceWith(
    0,
    view.state.doc.content.size,
    nextDoc.content,
  );

  const anchorPos = clampSelectionPos(
    tr.doc.content.size,
    resolveAnchorPos(tr.doc, analysis.anchor),
  );
  tr = tr.setSelection(TextSelection.create(tr.doc, anchorPos));

  if (insertion?.type === "text") {
    tr = tr.insertText(insertion.text);
  } else if (insertion?.type === "slice") {
    tr = tr.replaceSelection(insertion.slice);
  }

  view.dispatch(tr.scrollIntoView());
  return true;
}

function resolveAnchorPos(doc: PMNode, anchor: SelectionAnchor): number {
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

function getDocumentMeta(storage: unknown): DocumentMeta | null {
  if (!storage || typeof storage !== "object") return null;
  const meta = (storage as Record<string, unknown>).documentMeta;
  if (!meta || typeof meta !== "object") return null;
  return meta as DocumentMeta;
}
