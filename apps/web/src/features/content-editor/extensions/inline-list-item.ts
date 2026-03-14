import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { splitListItem } from "@tiptap/pm/schema-list";
import { type EditorState, type Transaction } from "@tiptap/pm/state";
import { InlineListItemView } from "../components/node-views/InlineListItemView";
import { maybeDeleteEmptyGroupListInstanceAndJump } from "./utils/group-list-instance-backspace";
import {
  deleteCurrentItemAndJump,
  deleteItemAndSelectNeighbor,
  dispatchSelectionJumpWithUndoMeta,
  getListItemContext,
  isCaretAtStartOfItem,
  isItemEmpty,
  moveSelectionBeforeContainer,
  resolveNextTargetForEmptyItem,
  resolveSelectionBeforeContainer,
} from "./utils/list-item-shared";

function splitItemWithSeed(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view: Parameters<ReturnType<typeof splitListItem>>[2],
): boolean {
  const inlineListItemType = state.schema.nodes.inlineListItem;
  if (!inlineListItemType) return false;

  return splitListItem(inlineListItemType)(state, dispatch, view);
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
        const { $from, empty } = state.selection;
        const context = getListItemContext($from, "inlineListItem", "inlineList");
        if (!context) return false;

        const { itemDepth: inlineListItemDepth, listDepth: inlineListDepth } =
          context;
        const inlineListNode = $from.node(inlineListDepth);
        const inlineListItemNode = $from.node(inlineListItemDepth);

        if (!empty || !isItemEmpty(inlineListItemNode)) {
          return splitItemWithSeed(
            state,
            editor.view.dispatch,
            editor.view,
          );
        }

        const inlineListItemIndex = $from.index(inlineListDepth);
        const inlineListItemPos = $from.before(inlineListItemDepth);
        const nextTarget = resolveNextTargetForEmptyItem(
          state,
          inlineListNode,
          inlineListItemNode,
          inlineListItemIndex,
          inlineListItemPos,
        );
        if (!nextTarget) {
          return true;
        }

        const targetEndPos = nextTarget.pos + nextTarget.node.nodeSize - 1;
        if (inlineListNode.childCount === 1) {
          dispatchSelectionJumpWithUndoMeta(
            state,
            editor.view.dispatch,
            targetEndPos,
          );
          return true;
        }

        deleteCurrentItemAndJump(
          state,
          editor.view.dispatch,
          inlineListItemPos,
          inlineListItemNode.nodeSize,
          targetEndPos,
        );
        return true;
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;
        const context = getListItemContext($from, "inlineListItem", "inlineList");
        if (!context) return false;

        const { itemDepth: inlineListItemDepth, listDepth: inlineListDepth } =
          context;
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
          const selectionBeforeInlineList = resolveSelectionBeforeContainer(
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

          moveSelectionBeforeContainer(
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
        deleteItemAndSelectNeighbor(
          state,
          editor.view.dispatch,
          inlineListNode,
          inlineListItemIndex,
          inlineListItemPos,
          inlineListItemNode.nodeSize,
        );
        return true;
      },
    };
  },
});
