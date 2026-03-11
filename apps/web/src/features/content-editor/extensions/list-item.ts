import { InputRule, Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { ListItemStyle } from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import { splitListItem } from "@tiptap/pm/schema-list";
import { Selection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { ListItemView } from "../components/node-views/ListItemView";
import { CARET_JUMP_UNDO_META } from "./caret-jump-undo";
import { maybeDeleteEmptyGroupListInstanceAndJump } from "./utils/group-list-instance-backspace";
import {
  applyStoredMarksFromDefaultFormat,
} from "./utils/default-format-marks";
import {
  findNextEditableTarget,
  type EditableBlock,
} from "./utils/previous-editable-block";

type ListItemContext = {
  listItemDepth: number;
  listDepth: number;
};

function getListItemContext(selectionFrom: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}): ListItemContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    if (selectionFrom.node(depth).type.name !== "listItem") {
      continue;
    }

    const listDepth = depth - 1;
    if (listDepth < 0 || selectionFrom.node(listDepth).type.name !== "list") {
      return null;
    }

    return { listItemDepth: depth, listDepth };
  }

  return null;
}

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

function splitItemWithStyleAndSeed(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view: Parameters<ReturnType<typeof splitListItem>>[2],
  nextStyle: ListItemStyle,
  defaultFormat: unknown,
): boolean {
  const listItemType = state.schema.nodes.listItem;
  if (!listItemType) return false;

  return splitListItem(listItemType, { style: nextStyle })(
    state,
    (tr) => {
      applyStoredMarksFromDefaultFormat(tr, state.schema, defaultFormat);
      dispatch(tr);
    },
    view,
  );
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

function isListItemEmpty(listItemNode: { textContent: string }): boolean {
  return listItemNode.textContent.trim().length === 0;
}

function isCaretAtStartOfItem(selectionFrom: { parentOffset: number }): boolean {
  return selectionFrom.parentOffset === 0;
}

function moveSelectionBeforeList(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  listStartPos: number,
  fromPos: number,
): boolean {
  const selection = resolveSelectionBeforeList(state, listStartPos);
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

function resolveSelectionBeforeList(
  state: EditorState,
  listStartPos: number,
): Selection | null {
  const selection = Selection.near(state.doc.resolve(listStartPos), -1);
  if (selection.from >= listStartPos) {
    return null;
  }

  return selection;
}

function resolveNextTargetForEmptyItem(
  state: EditorState,
  listNode: PMNode,
  listItemNode: PMNode,
  listItemIndex: number,
  listItemPos: number,
): EditableBlock | null {
  const hasNextSibling = listItemIndex < listNode.childCount - 1;
  if (hasNextSibling) {
    const nextSiblingPos = listItemPos + listItemNode.nodeSize;
    const nextSiblingNode = listNode.child(listItemIndex + 1);
    return { pos: nextSiblingPos, node: nextSiblingNode };
  }

  const listItemEndPos = listItemPos + listItemNode.nodeSize - 1;
  return findNextEditableTarget(state.doc, listItemEndPos);
}

function dispatchSelectionJumpWithUndoMeta(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  toPos: number,
): void {
  dispatch(
    state.tr
      .setSelection(Selection.near(state.doc.resolve(toPos), -1))
      .setMeta(CARET_JUMP_UNDO_META, {
        from: state.selection.from,
        to: toPos,
      })
      .scrollIntoView(),
  );
}

function deleteCurrentItemAndJump(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  listItemPos: number,
  listItemNodeSize: number,
  targetEndPos: number,
): void {
  const tr = state.tr.delete(listItemPos, listItemPos + listItemNodeSize);
  const mappedTargetPos = tr.mapping.map(targetEndPos, -1);
  const selectionPos = Math.max(1, Math.min(mappedTargetPos, tr.doc.content.size));
  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
  dispatch(tr.scrollIntoView());
}

function createListStyleInputRule(
  find: RegExp,
  style: ListItemStyle,
): InputRule {
  return new InputRule({
    find,
    handler: ({ state, range, commands }) => {
      const $ruleStart = state.doc.resolve(range.from);
      const context = getListItemContext($ruleStart);
      if (!context) {
        return null;
      }

      const listNode = $ruleStart.node(context.listDepth);
      if (range.from !== $ruleStart.start()) {
        return null;
      }

      const listItemPos = $ruleStart.before(context.listItemDepth);
      const listItemNode = $ruleStart.node(context.listItemDepth);

      const applied = commands.command(({ dispatch }) => {
        const tr = state.tr
          .delete(range.from, range.to)
          .setNodeMarkup(listItemPos, undefined, {
            ...listItemNode.attrs,
            style,
          });

        applyStoredMarksFromDefaultFormat(tr, state.schema, listNode.attrs.defaultFormat);

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
        const context = getListItemContext($from);

        if (!context) {
          return splitItemWithCurrentBehavior(
            state,
            editor.view.dispatch,
            editor.view,
          );
        }

        const { listItemDepth, listDepth } = context;
        const listNode = $from.node(listDepth);
        const listItemNode = $from.node(listItemDepth);

        if (!empty || !isListItemEmpty(listItemNode)) {
          const nextStyle = resolveNextListItemStyle(listNode, listItemNode);
          return splitItemWithStyleAndSeed(
            state,
            editor.view.dispatch,
            editor.view,
            nextStyle,
            listNode.attrs.defaultFormat,
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
        const context = getListItemContext($from);
        if (!context) return false;

        const { listItemDepth, listDepth } = context;
        const listNode = $from.node(listDepth);
        const listItemNode = $from.node(listItemDepth);
        const listItemIndex = $from.index(listDepth);
        const isFirstItem = listItemIndex === 0;
        const itemIsEmpty = isListItemEmpty(listItemNode);
        const caretAtStart = isCaretAtStartOfItem($from);

        if (!caretAtStart) return false;

        if (isStyledListItem(listItemNode.attrs.style)) {
          const listItemPos = $from.before(listItemDepth);
          const tr = state.tr.setNodeMarkup(listItemPos, undefined, {
            ...listItemNode.attrs,
            style: "plain",
          });
          applyStoredMarksFromDefaultFormat(tr, state.schema, listNode.attrs.defaultFormat);
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
          const selectionBeforeList = resolveSelectionBeforeList(
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

          moveSelectionBeforeList(
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
        const deleteFrom = listItemPos;
        const deleteTo = listItemPos + listItemNode.nodeSize;
        const hasPreviousSibling = listItemIndex > 0;

        const tr = state.tr.delete(deleteFrom, deleteTo);
        if (hasPreviousSibling) {
          const previousNode = listNode.child(listItemIndex - 1);
          const previousNodePos = listItemPos - previousNode.nodeSize;
          const previousNodeEnd = previousNodePos + previousNode.nodeSize - 1;
          const selectionPos = Math.max(
            0,
            Math.min(previousNodeEnd, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
        } else {
          const selectionPos = Math.max(
            0,
            Math.min(listItemPos + 1, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));
        }

        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});
