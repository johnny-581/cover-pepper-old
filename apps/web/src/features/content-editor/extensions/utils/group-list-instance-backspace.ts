import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { Selection, type EditorState, type Transaction } from "@tiptap/pm/state";

type GroupListInstanceContext = {
  instanceNode: PMNode;
  instanceStartPos: number;
  parentGroupListNode: PMNode;
};

const EDITABLE_NODE_NAMES = new Set(["field", "listItem", "inlineListItem"]);

export function maybeDeleteEmptyGroupListInstanceAndJump(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  currentEditableStartPos: number,
  jumpTargetPos: number,
): boolean {
  const context = findGroupListInstanceContext(state.selection.$from);
  if (!context) return false;
  if (context.parentGroupListNode.childCount <= 1) return false;

  const firstEditablePos = findFirstEditablePosInInstance(
    context.instanceNode,
    context.instanceStartPos,
  );
  if (firstEditablePos == null) return false;
  if (firstEditablePos !== currentEditableStartPos) return false;
  if (!isGroupListInstanceFullyEmpty(context.instanceNode)) return false;

  const tr = state.tr.delete(
    context.instanceStartPos,
    context.instanceStartPos + context.instanceNode.nodeSize,
  );
  const mappedTargetPos = tr.mapping.map(jumpTargetPos, -1);
  const selectionPos = Math.max(1, Math.min(mappedTargetPos, tr.doc.content.size));
  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
  dispatch(tr.scrollIntoView());
  return true;
}

function findGroupListInstanceContext(
  selectionFrom: ResolvedPos,
): GroupListInstanceContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    if (selectionFrom.node(depth).type.name !== "groupListInstance") {
      continue;
    }

    const parentDepth = depth - 1;
    if (selectionFrom.node(parentDepth).type.name !== "groupList") {
      return null;
    }

    return {
      instanceNode: selectionFrom.node(depth),
      instanceStartPos: selectionFrom.before(depth),
      parentGroupListNode: selectionFrom.node(parentDepth),
    };
  }

  return null;
}

function findFirstEditablePosInInstance(
  instanceNode: PMNode,
  instanceStartPos: number,
): number | null {
  const contentStartPos = instanceStartPos + 1;
  let firstEditablePos: number | null = null;

  instanceNode.descendants((node, nodePos) => {
    if (firstEditablePos != null) {
      return false;
    }

    if (EDITABLE_NODE_NAMES.has(node.type.name)) {
      firstEditablePos = contentStartPos + nodePos;
      return false;
    }

    return undefined;
  });

  return firstEditablePos;
}

function isGroupListInstanceFullyEmpty(instanceNode: PMNode): boolean {
  let hasNonWhitespaceText = false;

  instanceNode.descendants((node) => {
    if (!node.isText) {
      return undefined;
    }

    if ((node.text ?? "").trim().length > 0) {
      hasNonWhitespaceText = true;
      return false;
    }

    return undefined;
  });

  return !hasNonWhitespaceText;
}
