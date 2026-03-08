import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { FieldView } from "../components/node-views/FieldView";
import {
  createEndSelectionForBlock,
  findPreviousEditableBlock,
} from "./utils/previous-editable-block";
import { CARET_JUMP_UNDO_META } from "./caret-jump-undo";

type FieldContext = {
  fieldNode: PMNode;
  fieldStartPos: number;
};

function getFieldContext(selectionFrom: ResolvedPos): FieldContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    if (selectionFrom.node(depth).type.name !== "field") continue;

    return {
      fieldNode: selectionFrom.node(depth),
      fieldStartPos: selectionFrom.before(depth),
    };
  }

  return null;
}

function isFieldEmpty(fieldNode: FieldContext["fieldNode"]): boolean {
  return (
    fieldNode.content.childCount === 1 &&
    fieldNode.content.firstChild?.type.name === "paragraph" &&
    fieldNode.content.firstChild.content.size === 0
  );
}

function handleDeleteFromEmptyField(editor: Editor): boolean {
  const { state } = editor;
  const { empty, $from } = state.selection;

  if (!empty) return false;

  const fieldContext = getFieldContext($from);
  if (!fieldContext) return false;
  if (!isFieldEmpty(fieldContext.fieldNode)) return false;

  const previousBlock = findPreviousEditableBlock(
    state.doc,
    fieldContext.fieldStartPos,
  );
  if (!previousBlock) {
    return true;
  }

  const selection = createEndSelectionForBlock(state.doc, previousBlock);
  editor.view.dispatch(
    state.tr
      .setSelection(selection)
      .setMeta(CARET_JUMP_UNDO_META, {
        from: state.selection.from,
        to: selection.from,
      })
      .scrollIntoView(),
  );
  return true;
}

export const FieldNode = Node.create({
  name: "field",
  content: "paragraph",
  isolating: true,

  addAttributes() {
    return {
      fieldId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans-sm" },
      background: { default: "none" },
      bold: { default: false },
      italic: { default: false },
      underline: { default: false },
      placeholder: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="field"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "field" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldView, {
      as: "div",
      className: "field",
      attrs: ({ node }) => ({
        "data-sizing": String(node.attrs.sizing ?? "fill"),
      }),
    });
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => handleDeleteFromEmptyField(editor),
      Delete: ({ editor }) => handleDeleteFromEmptyField(editor),
    };
  },
});
