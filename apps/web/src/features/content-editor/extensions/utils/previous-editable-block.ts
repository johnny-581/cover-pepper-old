import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";

const EDITABLE_BLOCK_NAMES = new Set(["field", "list"]);

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

    if (EDITABLE_BLOCK_NAMES.has(node.type.name)) {
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
