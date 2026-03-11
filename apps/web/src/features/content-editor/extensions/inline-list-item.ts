import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { splitListItem } from "@tiptap/pm/schema-list";
import { Selection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { InlineListItemView } from "../components/node-views/InlineListItemView";
import { CARET_JUMP_UNDO_META } from "./caret-jump-undo";
import { maybeDeleteEmptyGroupListInstanceAndJump } from "./utils/group-list-instance-backspace";
import { applyStoredMarksFromDefaultFormat } from "./utils/default-format-marks";

type InlineListItemContext = {
  inlineListItemDepth: number;
  inlineListDepth: number;
};

function getInlineListItemContext(selectionFrom: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}): InlineListItemContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    if (selectionFrom.node(depth).type.name !== "inlineListItem") {
      continue;
    }

    const inlineListDepth = depth - 1;
    if (
      inlineListDepth < 0 ||
      selectionFrom.node(inlineListDepth).type.name !== "inlineList"
    ) {
      return null;
    }

    return { inlineListItemDepth: depth, inlineListDepth };
  }

  return null;
}

function splitItemWithSeed(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view: Parameters<ReturnType<typeof splitListItem>>[2],
  defaultFormat: unknown,
): boolean {
  const inlineListItemType = state.schema.nodes.inlineListItem;
  if (!inlineListItemType) return false;

  return splitListItem(inlineListItemType)(
    state,
    (tr) => {
      applyStoredMarksFromDefaultFormat(tr, state.schema, defaultFormat);
      dispatch(tr);
    },
    view,
  );
}

function isItemEmpty(node: { textContent: string }): boolean {
  return node.textContent.trim().length === 0;
}

function isCaretAtStartOfItem(selectionFrom: { parentOffset: number }): boolean {
  return selectionFrom.parentOffset === 0;
}

function resolveSelectionBeforeInlineList(
  state: EditorState,
  inlineListStartPos: number,
): Selection | null {
  const selection = Selection.near(state.doc.resolve(inlineListStartPos), -1);
  if (selection.from >= inlineListStartPos) {
    return null;
  }

  return selection;
}

function moveSelectionBeforeInlineList(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  inlineListStartPos: number,
  fromPos: number,
): boolean {
  const selection = resolveSelectionBeforeInlineList(state, inlineListStartPos);
  if (!selection) {
    return false;
  }

  dispatch(
    state.tr
      .setSelection(selection)
      .setMeta(CARET_JUMP_UNDO_META, { from: fromPos, to: selection.from }),
  );
  return true;
}

export const InlineListItemNode = Node.create({
  name: "inlineListItem",
  content: "paragraph",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="inline-list-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "inline-list-item" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineListItemView, {
      as: "div",
    });
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const context = getInlineListItemContext($from);
        if (!context) return false;

        const { inlineListDepth } = context;
        const inlineListNode = $from.node(inlineListDepth);

        return splitItemWithSeed(
          state,
          editor.view.dispatch,
          editor.view,
          inlineListNode.attrs.defaultFormat,
        );
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;
        const context = getInlineListItemContext($from);
        if (!context) return false;

        const { inlineListItemDepth, inlineListDepth } = context;
        const inlineListNode = $from.node(inlineListDepth);
        const inlineListItemNode = $from.node(inlineListItemDepth);
        const inlineListItemIndex = $from.index(inlineListDepth);
        const isFirstItem = inlineListItemIndex === 0;
        const itemIsEmpty = isItemEmpty(inlineListItemNode);
        const caretAtStart = isCaretAtStartOfItem($from);

        if (!caretAtStart) return false;

        if (isFirstItem && !itemIsEmpty) {
          // Keep list boundaries fixed: do not let Backspace lift/join this list.
          return true;
        }

        if (!itemIsEmpty) return false;

        if (isFirstItem && inlineListNode.childCount === 1) {
          const inlineListStartPos = $from.before(inlineListDepth);
          const selectionBeforeInlineList = resolveSelectionBeforeInlineList(
            state,
            inlineListStartPos,
          );
          if (selectionBeforeInlineList) {
            const inlineListItemPos = $from.before(inlineListItemDepth);
            const deletedGroupListInstance =
              maybeDeleteEmptyGroupListInstanceAndJump(
                state,
                editor.view.dispatch,
                inlineListItemPos,
                selectionBeforeInlineList.from,
              );
            if (deletedGroupListInstance) {
              return true;
            }
          }

          moveSelectionBeforeInlineList(
            state,
            editor.view.dispatch,
            inlineListStartPos,
            state.selection.from,
          );
          return true;
        }

        if (inlineListNode.childCount <= 1) {
          // Keep one editable item in every inline list.
          return true;
        }

        const inlineListItemPos = $from.before(inlineListItemDepth);
        const deleteFrom = inlineListItemPos;
        const deleteTo = inlineListItemPos + inlineListItemNode.nodeSize;
        const hasPreviousSibling = inlineListItemIndex > 0;

        const tr = state.tr.delete(deleteFrom, deleteTo);
        if (hasPreviousSibling) {
          const previousNode = inlineListNode.child(inlineListItemIndex - 1);
          const previousNodePos = inlineListItemPos - previousNode.nodeSize;
          const previousNodeEnd = previousNodePos + previousNode.nodeSize - 1;
          const selectionPos = Math.max(
            0,
            Math.min(previousNodeEnd, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
        } else {
          const selectionPos = Math.max(
            0,
            Math.min(inlineListItemPos + 1, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));
        }

        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});
