import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { FieldView } from "../components/node-views/FieldView";
import {
  createEndSelectionForBlock,
  findNextEditableTarget,
  findPreviousEditableBlock,
} from "./utils/previous-editable-block";
import { CARET_JUMP_UNDO_META } from "./caret-jump-undo";
import { maybeDeleteEmptyGroupListInstanceAndJump } from "./utils/group-list-instance-backspace";

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

function handleDeleteFromEmptyField(
  editor: Editor,
  deleteEmptyGroupListInstance: boolean,
): boolean {
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
  if (deleteEmptyGroupListInstance) {
    const deletedGroupListInstance = maybeDeleteEmptyGroupListInstanceAndJump(
      state,
      editor.view.dispatch,
      fieldContext.fieldStartPos,
      selection.from,
    );
    if (deletedGroupListInstance) {
      return true;
    }
  }

  dispatchSelectionJump(editor, selection.from);
  return true;
}

function handleEnterFromEmptyField(editor: Editor): boolean {
  const { state } = editor;
  const { empty, $from } = state.selection;

  if (!empty) return false;

  const fieldContext = getFieldContext($from);
  if (!fieldContext) return false;
  if (!isFieldEmpty(fieldContext.fieldNode)) return false;

  const fieldEndPos = fieldContext.fieldStartPos + fieldContext.fieldNode.nodeSize - 1;
  const nextTarget = findNextEditableTarget(state.doc, fieldEndPos);
  if (!nextTarget) {
    return true;
  }

  const selection = createEndSelectionForBlock(state.doc, nextTarget);
  dispatchSelectionJump(editor, selection.from);
  return true;
}

function dispatchSelectionJump(editor: Editor, nextSelectionPos: number): void {
  const { state } = editor;
  editor.view.dispatch(
    state.tr
      .setSelection(Selection.near(state.doc.resolve(nextSelectionPos), -1))
      .setMeta(CARET_JUMP_UNDO_META, {
        from: state.selection.from,
        to: nextSelectionPos,
      })
      .scrollIntoView(),
  );
}

export const FieldNode = Node.create({
  name: "field",
  content: "paragraph",
  isolating: true,

  addAttributes() {
    return {
      fieldId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans" },
      size: { default: "normal" },
      background: { default: "none" },
      defaultFormat: { default: {} },
      hideable: { default: false },
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
      Enter: ({ editor }) => handleEnterFromEmptyField(editor),
      Backspace: ({ editor }) => handleDeleteFromEmptyField(editor, true),
      Delete: ({ editor }) => handleDeleteFromEmptyField(editor, false),
    };
  },
});
