import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { Selection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { CARET_JUMP_UNDO_META } from "../caret-jump-undo";
import {
  findNextEditableTarget,
  type EditableBlock,
} from "./previous-editable-block";

export type ListItemContext = {
  itemDepth: number;
  listDepth: number;
};

export function getListItemContext(
  selectionFrom: ResolvedPos,
  itemNodeName: string,
  listNodeName: string,
): ListItemContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    if (selectionFrom.node(depth).type.name !== itemNodeName) {
      continue;
    }

    const listDepth = depth - 1;
    if (
      listDepth < 0 ||
      selectionFrom.node(listDepth).type.name !== listNodeName
    ) {
      return null;
    }

    return { itemDepth: depth, listDepth };
  }

  return null;
}

export function isItemEmpty(node: { textContent: string }): boolean {
  return node.textContent.trim().length === 0;
}

export function isCaretAtStartOfItem(selectionFrom: {
  parentOffset: number;
}): boolean {
  return selectionFrom.parentOffset === 0;
}

export function resolveSelectionBeforeContainer(
  state: EditorState,
  containerStartPos: number,
): Selection | null {
  const selection = Selection.near(state.doc.resolve(containerStartPos), -1);
  if (selection.from >= containerStartPos) {
    return null;
  }

  return selection;
}

export function moveSelectionBeforeContainer(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  containerStartPos: number,
  fromPos: number,
): boolean {
  const selection = resolveSelectionBeforeContainer(state, containerStartPos);
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

export function resolveNextTargetForEmptyItem(
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

export function dispatchSelectionJumpWithUndoMeta(
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

export function deleteCurrentItemAndJump(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  itemPos: number,
  itemNodeSize: number,
  targetEndPos: number,
): void {
  const tr = state.tr.delete(itemPos, itemPos + itemNodeSize);
  const mappedTargetPos = tr.mapping.map(targetEndPos, -1);
  const selectionPos = Math.max(1, Math.min(mappedTargetPos, tr.doc.content.size));
  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
  dispatch(tr.scrollIntoView());
}

export function deleteItemAndSelectNeighbor(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  listNode: PMNode,
  listItemIndex: number,
  listItemPos: number,
  listItemNodeSize: number,
): void {
  const deleteFrom = listItemPos;
  const deleteTo = listItemPos + listItemNodeSize;
  const hasPreviousSibling = listItemIndex > 0;

  const tr = state.tr.delete(deleteFrom, deleteTo);
  if (hasPreviousSibling) {
    const previousNode = listNode.child(listItemIndex - 1);
    const previousNodePos = listItemPos - previousNode.nodeSize;
    const previousNodeEnd = previousNodePos + previousNode.nodeSize - 1;
    const selectionPos = Math.max(0, Math.min(previousNodeEnd, tr.doc.content.size));
    tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
  } else {
    const selectionPos = Math.max(0, Math.min(listItemPos + 1, tr.doc.content.size));
    tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));
  }

  dispatch(tr);
}
