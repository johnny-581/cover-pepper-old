import type { JSONContent } from "./build-empty-structure";

export type SelectionAnchor = {
  path: number[];
  textOffset: number;
};

export function rangesOverlap(
  start: number,
  end: number,
  selectionFrom: number,
  selectionTo: number,
): boolean {
  return Math.max(start, selectionFrom) < Math.min(end, selectionTo);
}

export function isFullySelected(
  start: number,
  end: number,
  selectionFrom: number,
  selectionTo: number,
): boolean {
  return selectionFrom <= start && end <= selectionTo;
}

export function clampSelectionPos(maxContentSize: number, pos: number): number {
  return Math.max(1, Math.min(pos, maxContentSize));
}

export function clampOffset(offset: number, max: number): number {
  return Math.max(0, Math.min(offset, max));
}

export function prependPath(
  index: number,
  anchor: SelectionAnchor | null,
): SelectionAnchor | null {
  if (!anchor) return null;

  return {
    path: [index, ...anchor.path],
    textOffset: anchor.textOffset,
  };
}

export function findFirstEditablePath(node: JSONContent): SelectionAnchor | null {
  if (node.type === "paragraph") {
    return { path: [], textOffset: 0 };
  }

  const content = node.content ?? [];
  for (let index = 0; index < content.length; index += 1) {
    const childAnchor = findFirstEditablePath(content[index]);
    if (childAnchor) {
      return prependPath(index, childAnchor);
    }
  }

  return null;
}

export function findFirstEditablePathInContent(
  content: JSONContent[],
): SelectionAnchor | null {
  for (let index = 0; index < content.length; index += 1) {
    const childAnchor = findFirstEditablePath(content[index]);
    if (childAnchor) {
      return prependPath(index, childAnchor);
    }
  }

  return null;
}

export function computeDeleteWindow(
  textStart: number,
  textSize: number,
  selectionFrom: number,
  selectionTo: number,
): { deleteFrom: number; deleteTo: number; textEnd: number } {
  const textEnd = textStart + textSize;

  return {
    deleteFrom: Math.max(selectionFrom, textStart) - textStart,
    deleteTo: Math.min(selectionTo, textEnd) - textStart,
    textEnd,
  };
}

export function selectionStartsInText(
  selectionFrom: number,
  textStart: number,
  textEnd: number,
): boolean {
  return selectionFrom >= textStart && selectionFrom <= textEnd;
}
