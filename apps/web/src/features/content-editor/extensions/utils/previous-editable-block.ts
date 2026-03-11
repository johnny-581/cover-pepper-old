import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";

const PREVIOUS_EDITABLE_BLOCK_NAMES = new Set(["field", "list", "inlineList"]);
const NEXT_EDITABLE_TARGET_NAMES = new Set([
  "field",
  "listItem",
  "inlineListItem",
]);

export type EditableBlock = {
  pos: number;
  node: PMNode;
};

export function findPreviousEditableBlock(
  doc: PMNode,
  beforePos: number,
): EditableBlock | null {
  let previous: EditableBlock | null = null;

  doc.descendants((node, pos) => {
    if (pos >= beforePos) {
      return false;
    }

    if (PREVIOUS_EDITABLE_BLOCK_NAMES.has(node.type.name)) {
      previous = { pos, node };
    }

    return undefined;
  });

  return previous;
}

export function createEndSelectionForBlock(
  doc: PMNode,
  block: EditableBlock,
): Selection {
  const endPos = block.pos + block.node.nodeSize - 1;
  return Selection.near(doc.resolve(endPos), -1);
}

export function findNextEditableTarget(
  doc: PMNode,
  afterPos: number,
): EditableBlock | null {
  let next: EditableBlock | null = null;

  doc.descendants((node, pos) => {
    if (next) {
      return false;
    }

    if (pos <= afterPos) {
      return undefined;
    }

    if (NEXT_EDITABLE_TARGET_NAMES.has(node.type.name)) {
      next = { pos, node };
      return false;
    }

    return undefined;
  });

  return next;
}
