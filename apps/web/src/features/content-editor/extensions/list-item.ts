import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { ListItemStyle } from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import { splitListItem } from "@tiptap/pm/schema-list";
import { type EditorState, type Transaction } from "@tiptap/pm/state";
import { ListItemView } from "../components/node-views/ListItemView";
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

function normalizeListItemStyle(
  style: unknown,
  fallback: ListItemStyle,
): ListItemStyle {
  if (style === "plain" || style === "bullet" || style === "numbered") {
    return style;
  }

  return fallback;
}

function isStyledListItem(style: unknown): boolean {
  return style === "bullet" || style === "numbered";
}

function resolveNextListItemStyle(
  listNode: PMNode,
  listItemNode: PMNode,
): ListItemStyle {
  const currentStyle = normalizeListItemStyle(listItemNode.attrs.style, "plain");
  if (isStyledListItem(currentStyle)) {
    return currentStyle;
  }

  return normalizeListItemStyle(listNode.attrs.defaultItemStyle, "plain");
}

function splitItemWithStyle(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view: Parameters<ReturnType<typeof splitListItem>>[2],
  nextStyle: ListItemStyle,
): boolean {
  const listItemType = state.schema.nodes.listItem;
  if (!listItemType) return false;

  return splitListItem(listItemType, { style: nextStyle })(state, dispatch, view);
}

function splitItemWithCurrentBehavior(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view: Parameters<ReturnType<typeof splitListItem>>[2],
): boolean {
  const listItemType = state.schema.nodes.listItem;
  if (!listItemType) return false;

  return splitListItem(listItemType)(state, dispatch, view);
}

function createListStyleInputRule(
  find: RegExp,
  style: ListItemStyle,
): InputRule {
  return new InputRule({
    find,
    handler: ({ state, range, commands }) => {
      const $ruleStart = state.doc.resolve(range.from);
      const context = getListItemContext($ruleStart, "listItem", "list");
      if (!context) {
        return null;
      }

      if (range.from !== $ruleStart.start()) {
        return null;
      }

      const listItemPos = $ruleStart.before(context.itemDepth);
      const listItemNode = $ruleStart.node(context.itemDepth);

      const applied = commands.command(({ dispatch }) => {
        const tr = state.tr
          .delete(range.from, range.to)
          .setNodeMarkup(listItemPos, undefined, {
            ...listItemNode.attrs,
            style,
          });

        if (dispatch) {
          dispatch(tr.scrollIntoView());
        }

        return true;
      });

      return applied ? undefined : null;
    },
  });
}

export const ListItemNode = Node.create({
  name: "listItem",
  content: "paragraph",
  defining: true,

  addAttributes() {
    return {
      style: { default: "plain" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="list-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "list-item" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ListItemView, {
      as: "div",
    });
  },

  addInputRules() {
    return [
      createListStyleInputRule(/^-\s$/, "bullet"),
      createListStyleInputRule(/^1\.\s$/, "numbered"),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        const context = getListItemContext($from, "listItem", "list");

        if (!context) {
          return splitItemWithCurrentBehavior(
            state,
            editor.view.dispatch,
            editor.view,
          );
        }

        const { itemDepth: listItemDepth, listDepth } = context;
        const listNode = $from.node(listDepth);
        const listItemNode = $from.node(listItemDepth);

        if (!empty || !isItemEmpty(listItemNode)) {
          const nextStyle = resolveNextListItemStyle(listNode, listItemNode);
          return splitItemWithStyle(
            state,
            editor.view.dispatch,
            editor.view,
            nextStyle,
          );
        }

        const listItemIndex = $from.index(listDepth);
        const listItemPos = $from.before(listItemDepth);
        const nextTarget = resolveNextTargetForEmptyItem(
          state,
          listNode,
          listItemNode,
          listItemIndex,
          listItemPos,
        );
        if (!nextTarget) {
          return true;
        }

        const targetEndPos = nextTarget.pos + nextTarget.node.nodeSize - 1;
        if (listNode.childCount === 1) {
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
          listItemPos,
          listItemNode.nodeSize,
          targetEndPos,
        );
        return true;
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;
        const context = getListItemContext($from, "listItem", "list");
        if (!context) return false;

        const { itemDepth: listItemDepth, listDepth } = context;
        const listNode = $from.node(listDepth);
        const listItemNode = $from.node(listItemDepth);
        const listItemIndex = $from.index(listDepth);
        const isFirstItem = listItemIndex === 0;
        const itemIsEmpty = isItemEmpty(listItemNode);
        const caretAtStart = isCaretAtStartOfItem($from);

        if (!caretAtStart) return false;

        if (isStyledListItem(listItemNode.attrs.style)) {
          const listItemPos = $from.before(listItemDepth);
          const tr = state.tr.setNodeMarkup(listItemPos, undefined, {
            ...listItemNode.attrs,
            style: "plain",
          });
          editor.view.dispatch(tr.scrollIntoView());
          return true;
        }

        if (isFirstItem && !itemIsEmpty) {
          // Keep list boundaries fixed: do not let Backspace lift/join this list.
          return true;
        }

        if (!itemIsEmpty) return false;

        if (isFirstItem && listNode.childCount === 1) {
          const listStartPos = $from.before(listDepth);
          const selectionBeforeList = resolveSelectionBeforeContainer(
            state,
            listStartPos,
          );
          if (selectionBeforeList) {
            const listItemPos = $from.before(listItemDepth);
            const deletedGroupListInstance =
              maybeDeleteEmptyGroupListInstanceAndJump(
                state,
                editor.view.dispatch,
                listItemPos,
                selectionBeforeList.from,
              );
            if (deletedGroupListInstance) {
              return true;
            }
          }

          moveSelectionBeforeContainer(
            state,
            editor.view.dispatch,
            listStartPos,
            state.selection.from,
          );
          return true;
        }

        if (listNode.childCount <= 1) {
          // Keep one editable item in every list.
          return true;
        }

        const listItemPos = $from.before(listItemDepth);
        deleteItemAndSelectNeighbor(
          state,
          editor.view.dispatch,
          listNode,
          listItemIndex,
          listItemPos,
          listItemNode.nodeSize,
        );
        return true;
      },
    };
  },
});
