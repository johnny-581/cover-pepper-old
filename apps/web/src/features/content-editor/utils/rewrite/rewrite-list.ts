import type { Node as PMNode } from "@tiptap/pm/model";
import {
  buildEmptyListItemFromNodeJSON,
  type JSONContent,
} from "../document/build-empty-structure";
import {
  clampOffset,
  computeDeleteWindow,
  findFirstEditablePath,
  isFullySelected,
  prependPath,
  rangesOverlap,
  selectionStartsInText,
} from "../selection/analyze-selection-helpers";
import {
  buildParagraphFromFragments,
  copyNodeJSON,
  nodeWithContent,
  trimParagraphJSON,
  unchanged,
  type RewriteResult,
} from "../document/node-json";

type ListItemOverlap = "none" | "full" | "partial";

type ListItemSelectionSlice = {
  node: PMNode;
  index: number;
  start: number;
  end: number;
  overlap: ListItemOverlap;
};

type MergedListItemResult = {
  json: JSONContent;
  joinOffset: number;
};

export function rewriteListNode(
  listNode: PMNode,
  listStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const slices = collectListItemSelectionSlices(
    listNode,
    listStart,
    selectionFrom,
    selectionTo,
  );

  const firstOverlappingIndex = slices.findIndex(
    (slice) => slice.overlap !== "none",
  );
  if (firstOverlappingIndex < 0) {
    return unchanged(listNode);
  }

  let lastOverlappingIndex = firstOverlappingIndex;
  for (
    let index = firstOverlappingIndex + 1;
    index < slices.length;
    index += 1
  ) {
    if (slices[index].overlap !== "none") {
      lastOverlappingIndex = index;
    }
  }

  const firstOverlappingSlice = slices[firstOverlappingIndex];
  const lastOverlappingSlice = slices[lastOverlappingIndex];
  const shouldMergeBoundaryItems =
    firstOverlappingSlice.overlap === "partial" &&
    lastOverlappingSlice.overlap === "partial" &&
    firstOverlappingSlice.index !== lastOverlappingSlice.index;

  const content: JSONContent[] = [];
  let changed = false;
  let anchor: RewriteResult["anchor"] = null;

  for (const slice of slices) {
    const isWithinOverlappingRange =
      slice.index >= firstOverlappingSlice.index &&
      slice.index <= lastOverlappingSlice.index;
    if (!isWithinOverlappingRange) {
      content.push(copyNodeJSON(slice.node));
      continue;
    }

    if (shouldMergeBoundaryItems) {
      if (slice.index === firstOverlappingSlice.index) {
        const merged = mergeBoundaryListItems(
          firstOverlappingSlice,
          lastOverlappingSlice,
          selectionFrom,
          selectionTo,
        );
        content.push(merged.json);
        changed = true;
        if (!anchor) {
          anchor = {
            path: [content.length - 1, 0],
            textOffset: merged.joinOffset,
          };
        }
      }
      continue;
    }

    if (slice.overlap === "full") {
      changed = true;
      continue;
    }

    if (slice.overlap === "partial") {
      const result = rewriteListItemNode(
        slice.node,
        slice.start,
        selectionFrom,
        selectionTo,
      );
      content.push(result.json);
      changed ||= result.changed;
      if (!anchor && result.anchor) {
        anchor = prependPath(content.length - 1, result.anchor);
      }
      continue;
    }

    content.push(copyNodeJSON(slice.node));
  }

  if (content.length === 0) {
    // Preserve list item style when recreating the mandatory empty row.
    const styleSourceNode = listNode.firstChild ?? listNode;
    const emptyItem = buildEmptyListItemFromNodeJSON(styleSourceNode);
    content.push(emptyItem);
    changed = true;
    anchor ??= prependPath(0, findFirstEditablePath(emptyItem));
  }

  return {
    json: nodeWithContent(listNode, content),
    changed,
    anchor,
  };
}

function collectListItemSelectionSlices(
  listNode: PMNode,
  listStart: number,
  selectionFrom: number,
  selectionTo: number,
): ListItemSelectionSlice[] {
  const slices: ListItemSelectionSlice[] = [];
  const listContentStart = listStart + 1;
  let childIndex = 0;

  listNode.forEach((child, offset) => {
    const childStart = listContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    slices.push({
      node: child,
      index: childIndex,
      start: childStart,
      end: childEnd,
      overlap: getListItemOverlap(childStart, childEnd, selectionFrom, selectionTo),
    });

    childIndex += 1;
  });

  return slices;
}

function getListItemOverlap(
  itemStart: number,
  itemEnd: number,
  selectionFrom: number,
  selectionTo: number,
): ListItemOverlap {
  if (!rangesOverlap(itemStart, itemEnd, selectionFrom, selectionTo)) {
    return "none";
  }

  if (isFullySelected(itemStart, itemEnd, selectionFrom, selectionTo)) {
    return "full";
  }

  return "partial";
}

function mergeBoundaryListItems(
  firstSlice: ListItemSelectionSlice,
  lastSlice: ListItemSelectionSlice,
  selectionFrom: number,
  selectionTo: number,
): MergedListItemResult {
  const firstParagraph = firstSlice.node.firstChild;
  const lastParagraph = lastSlice.node.firstChild;
  if (!firstParagraph || firstParagraph.type.name !== "paragraph") {
    return { json: copyNodeJSON(firstSlice.node), joinOffset: 0 };
  }
  if (!lastParagraph || lastParagraph.type.name !== "paragraph") {
    return { json: copyNodeJSON(firstSlice.node), joinOffset: 0 };
  }

  const firstTextStart = firstSlice.start + 2;
  const lastTextStart = lastSlice.start + 2;

  const joinOffset = clampOffset(
    selectionFrom - firstTextStart,
    firstParagraph.content.size,
  );
  const suffixOffset = clampOffset(
    selectionTo - lastTextStart,
    lastParagraph.content.size,
  );

  const leftFragment = firstParagraph.content.cut(0, joinOffset);
  const rightFragment = lastParagraph.content.cut(
    suffixOffset,
    lastParagraph.content.size,
  );

  return {
    json: nodeWithContent(firstSlice.node, [
      buildParagraphFromFragments(firstParagraph, leftFragment, rightFragment),
    ]),
    joinOffset,
  };
}

function rewriteListItemNode(
  listItemNode: PMNode,
  itemStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const paragraph = listItemNode.firstChild;
  if (!paragraph || paragraph.type.name !== "paragraph") {
    return unchanged(listItemNode);
  }

  const textStart = itemStart + 2;
  const { deleteFrom, deleteTo, textEnd } = computeDeleteWindow(
    textStart,
    paragraph.content.size,
    selectionFrom,
    selectionTo,
  );

  if (deleteFrom >= deleteTo) {
    return unchanged(listItemNode);
  }

  return {
    json: nodeWithContent(listItemNode, [
      trimParagraphJSON(paragraph, deleteFrom, deleteTo),
    ]),
    changed: true,
    anchor: selectionStartsInText(selectionFrom, textStart, textEnd)
      ? { path: [0], textOffset: deleteFrom }
      : null,
  };
}
