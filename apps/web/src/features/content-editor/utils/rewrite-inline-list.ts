import type { Node as PMNode } from "@tiptap/pm/model";
import {
  buildEmptyInlineListItemFromNodeJSON,
  type JSONContent,
} from "./build-empty-structure";
import {
  clampOffset,
  computeDeleteWindow,
  findFirstEditablePath,
  isFullySelected,
  prependPath,
  rangesOverlap,
  selectionStartsInText,
} from "./analyze-selection-helpers";
import {
  buildParagraphFromFragments,
  copyNodeJSON,
  nodeWithContent,
  trimParagraphJSON,
  unchanged,
  type RewriteResult,
} from "./node-json";

type InlineListItemOverlap = "none" | "full" | "partial";

type InlineListItemSelectionSlice = {
  node: PMNode;
  index: number;
  start: number;
  end: number;
  overlap: InlineListItemOverlap;
};

type MergedInlineListItemResult = {
  json: JSONContent;
  joinOffset: number;
};

export function rewriteInlineListNode(
  inlineListNode: PMNode,
  inlineListStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const slices = collectInlineListItemSelectionSlices(
    inlineListNode,
    inlineListStart,
    selectionFrom,
    selectionTo,
  );

  const firstOverlappingIndex = slices.findIndex(
    (slice) => slice.overlap !== "none",
  );
  if (firstOverlappingIndex < 0) {
    return unchanged(inlineListNode);
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
        const merged = mergeBoundaryInlineListItems(
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
      const result = rewriteInlineListItemNode(
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
    const emptyItem = buildEmptyInlineListItemFromNodeJSON(
      inlineListNode.firstChild ?? inlineListNode,
    );
    content.push(emptyItem);
    changed = true;
    anchor ??= prependPath(0, findFirstEditablePath(emptyItem));
  }

  return {
    json: nodeWithContent(inlineListNode, content),
    changed,
    anchor,
  };
}

function collectInlineListItemSelectionSlices(
  inlineListNode: PMNode,
  inlineListStart: number,
  selectionFrom: number,
  selectionTo: number,
): InlineListItemSelectionSlice[] {
  const slices: InlineListItemSelectionSlice[] = [];
  const inlineListContentStart = inlineListStart + 1;
  let childIndex = 0;

  inlineListNode.forEach((child, offset) => {
    const childStart = inlineListContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    slices.push({
      node: child,
      index: childIndex,
      start: childStart,
      end: childEnd,
      overlap: getInlineListItemOverlap(
        childStart,
        childEnd,
        selectionFrom,
        selectionTo,
      ),
    });

    childIndex += 1;
  });

  return slices;
}

function getInlineListItemOverlap(
  itemStart: number,
  itemEnd: number,
  selectionFrom: number,
  selectionTo: number,
): InlineListItemOverlap {
  if (!rangesOverlap(itemStart, itemEnd, selectionFrom, selectionTo)) {
    return "none";
  }

  if (isFullySelected(itemStart, itemEnd, selectionFrom, selectionTo)) {
    return "full";
  }

  return "partial";
}

function mergeBoundaryInlineListItems(
  firstSlice: InlineListItemSelectionSlice,
  lastSlice: InlineListItemSelectionSlice,
  selectionFrom: number,
  selectionTo: number,
): MergedInlineListItemResult {
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

function rewriteInlineListItemNode(
  inlineListItemNode: PMNode,
  itemStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const paragraph = inlineListItemNode.firstChild;
  if (!paragraph || paragraph.type.name !== "paragraph") {
    return unchanged(inlineListItemNode);
  }

  const textStart = itemStart + 2;
  const { deleteFrom, deleteTo, textEnd } = computeDeleteWindow(
    textStart,
    paragraph.content.size,
    selectionFrom,
    selectionTo,
  );

  if (deleteFrom >= deleteTo) {
    return unchanged(inlineListItemNode);
  }

  return {
    json: nodeWithContent(inlineListItemNode, [
      trimParagraphJSON(paragraph, deleteFrom, deleteTo),
    ]),
    changed: true,
    anchor: selectionStartsInText(selectionFrom, textStart, textEnd)
      ? { path: [0], textOffset: deleteFrom }
      : null,
  };
}
