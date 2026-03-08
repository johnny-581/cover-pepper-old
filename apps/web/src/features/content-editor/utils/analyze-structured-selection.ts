import type { Template } from "@pepper-apply/shared";
import type { Fragment, Node as PMNode } from "@tiptap/pm/model";
import type { Selection } from "@tiptap/pm/state";
import {
  buildEmptyFieldFromNodeJSON,
  buildEmptyGroupListInstanceJSON,
  buildEmptyListItemFromNodeJSON,
  type JSONContent,
} from "./build-empty-structure";
import { findGroupListDefById } from "./schema-helpers";

export type AnchorPath = {
  path: number[];
  textOffset: number;
};

export type StructuredSelectionAnalysis = {
  doc: JSONContent;
  anchor: AnchorPath;
};

type RewriteResult = {
  json: JSONContent;
  changed: boolean;
  anchor: AnchorPath | null;
};

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

export function analyzeStructuredSelection(
  doc: PMNode,
  selection: Selection,
  template: Template,
): StructuredSelectionAnalysis | null {
  if (selection.empty) return null;

  const sameParagraphSelection =
    selection.$from.sameParent(selection.$to) &&
    selection.$from.parent.type.name === "paragraph";
  if (sameParagraphSelection) return null;

  const content: JSONContent[] = [];
  let changed = false;
  let anchor: AnchorPath | null = null;
  let childIndex = 0;

  doc.forEach((child, offset) => {
    const childStart = offset;
    const childEnd = childStart + child.nodeSize;

    if (!rangesOverlap(childStart, childEnd, selection.from, selection.to)) {
      content.push(copyNodeJSON(child));
      childIndex += 1;
      return;
    }

    const result = rewriteLayoutNode(
      child,
      childStart,
      selection.from,
      selection.to,
      template,
    );
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(childIndex, result.anchor);
    }
    childIndex += 1;
  });

  if (!changed) return null;

  return {
    doc: { type: "doc", content },
    anchor: anchor ?? findFirstEditablePathInContent(content) ?? { path: [], textOffset: 0 },
  };
}

function rewriteLayoutNode(
  node: PMNode,
  nodeStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
): RewriteResult {
  if (node.type.name === "row") {
    return rewriteRowNode(node, nodeStart, selectionFrom, selectionTo);
  }

  if (node.type.name === "list") {
    return rewriteListNode(node, nodeStart, selectionFrom, selectionTo);
  }

  if (node.type.name === "groupList") {
    return rewriteGroupListNode(node, nodeStart, selectionFrom, selectionTo, template);
  }

  return { json: copyNodeJSON(node), changed: false, anchor: null };
}

function rewriteRowNode(
  rowNode: PMNode,
  rowStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const content: JSONContent[] = [];
  let changed = false;
  let anchor: AnchorPath | null = null;
  let childIndex = 0;
  const rowContentStart = rowStart + 1;

  rowNode.forEach((child, offset) => {
    const childStart = rowContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (child.type.name === "decorator" || !rangesOverlap(childStart, childEnd, selectionFrom, selectionTo)) {
      content.push(copyNodeJSON(child));
      childIndex += 1;
      return;
    }

    let result: RewriteResult;
    if (child.type.name === "field") {
      result = rewriteFieldNode(child, childStart, selectionFrom, selectionTo);
    } else if (child.type.name === "list") {
      result = rewriteListNode(child, childStart, selectionFrom, selectionTo);
    } else {
      result = { json: copyNodeJSON(child), changed: false, anchor: null };
    }

    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(childIndex, result.anchor);
    }
    childIndex += 1;
  });

  return {
    json: { ...copyNodeJSON(rowNode), content },
    changed,
    anchor,
  };
}

function rewriteFieldNode(
  fieldNode: PMNode,
  fieldStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const fieldEnd = fieldStart + fieldNode.nodeSize;
  if (!rangesOverlap(fieldStart, fieldEnd, selectionFrom, selectionTo)) {
    return { json: copyNodeJSON(fieldNode), changed: false, anchor: null };
  }

  if (isFullySelected(fieldStart, fieldEnd, selectionFrom, selectionTo)) {
    const json = buildEmptyFieldFromNodeJSON(fieldNode);
    return {
      json,
      changed: true,
      anchor: findFirstEditablePath(json),
    };
  }

  const paragraph = fieldNode.firstChild;
  if (!paragraph || paragraph.type.name !== "paragraph") {
    return { json: copyNodeJSON(fieldNode), changed: false, anchor: null };
  }

  const paragraphTextStart = fieldStart + 2;
  const paragraphTextEnd = paragraphTextStart + paragraph.content.size;
  const deleteFrom = Math.max(selectionFrom, paragraphTextStart) - paragraphTextStart;
  const deleteTo = Math.min(selectionTo, paragraphTextEnd) - paragraphTextStart;

  if (deleteFrom >= deleteTo) {
    return { json: copyNodeJSON(fieldNode), changed: false, anchor: null };
  }

  const json: JSONContent = {
    ...copyNodeJSON(fieldNode),
    content: [trimParagraphJSON(paragraph, deleteFrom, deleteTo)],
  };

  return {
    json,
    changed: true,
    anchor:
      selectionFrom >= paragraphTextStart && selectionFrom <= paragraphTextEnd
        ? { path: [0], textOffset: deleteFrom }
        : null,
  };
}

function rewriteListNode(
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

  const firstOverlappingIndex = slices.findIndex((slice) => slice.overlap !== "none");
  if (firstOverlappingIndex < 0) {
    return { json: copyNodeJSON(listNode), changed: false, anchor: null };
  }

  let lastOverlappingIndex = firstOverlappingIndex;
  for (let index = firstOverlappingIndex + 1; index < slices.length; index += 1) {
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
  let anchor: AnchorPath | null = null;

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
          anchor = { path: [content.length - 1, 0], textOffset: merged.joinOffset };
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
    const emptyItem = buildEmptyListItemFromNodeJSON(listNode.firstChild ?? listNode);
    content.push(emptyItem);
    changed = true;
    anchor ??= prependPath(0, findFirstEditablePath(emptyItem));
  }

  return {
    json: { ...copyNodeJSON(listNode), content },
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
    const overlap = getListItemOverlap(
      childStart,
      childEnd,
      selectionFrom,
      selectionTo,
    );

    slices.push({
      node: child,
      index: childIndex,
      start: childStart,
      end: childEnd,
      overlap,
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
    json: {
      ...copyNodeJSON(firstSlice.node),
      content: [buildParagraphFromFragments(firstParagraph, leftFragment, rightFragment)],
    },
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
    return { json: copyNodeJSON(listItemNode), changed: false, anchor: null };
  }

  const textStart = itemStart + 2;
  const textEnd = textStart + paragraph.content.size;
  const deleteFrom = Math.max(selectionFrom, textStart) - textStart;
  const deleteTo = Math.min(selectionTo, textEnd) - textStart;

  if (deleteFrom >= deleteTo) {
    return { json: copyNodeJSON(listItemNode), changed: false, anchor: null };
  }

  return {
    json: {
      ...copyNodeJSON(listItemNode),
      content: [trimParagraphJSON(paragraph, deleteFrom, deleteTo)],
    },
    changed: true,
    anchor:
      selectionFrom >= textStart && selectionFrom <= textEnd
        ? { path: [0], textOffset: deleteFrom }
        : null,
  };
}

function rewriteGroupListNode(
  groupListNode: PMNode,
  groupListStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
): RewriteResult {
  const groupListId = groupListNode.attrs.groupListId as string;
  const groupListDef = findGroupListDefById(template, groupListId);
  if (!groupListDef) {
    throw new Error(`Unknown group list: ${groupListId}`);
  }

  const layout = findGroupListLayout(template.layout, groupListId);
  if (!layout) {
    throw new Error(`Unknown group list layout: ${groupListId}`);
  }

  const content: JSONContent[] = [];
  let changed = false;
  let anchor: AnchorPath | null = null;
  let selectedRangeActive = false;
  const groupListContentStart = groupListStart + 1;

  const flushSelectedRange = () => {
    if (!selectedRangeActive) return;
    const emptyInstance = buildEmptyGroupListInstanceJSON(groupListDef, layout);
    const insertedIndex = content.length;
    content.push(emptyInstance);
    changed = true;
    if (!anchor) {
      anchor = prependPath(insertedIndex, findFirstEditablePath(emptyInstance));
    }
    selectedRangeActive = false;
  };

  groupListNode.forEach((child, offset) => {
    const childStart = groupListContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (!rangesOverlap(childStart, childEnd, selectionFrom, selectionTo)) {
      flushSelectedRange();
      content.push(copyNodeJSON(child));
      return;
    }

    if (isFullySelected(childStart, childEnd, selectionFrom, selectionTo)) {
      selectedRangeActive = true;
      return;
    }

    flushSelectedRange();
    const result = rewriteGroupListInstanceNode(
      child,
      childStart,
      selectionFrom,
      selectionTo,
      template,
    );
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(content.length - 1, result.anchor);
    }
  });

  flushSelectedRange();

  if (content.length === 0) {
    const emptyInstance = buildEmptyGroupListInstanceJSON(groupListDef, layout);
    content.push(emptyInstance);
    changed = true;
    anchor ??= prependPath(0, findFirstEditablePath(emptyInstance));
  }

  return {
    json: {
      ...copyNodeJSON(groupListNode),
      content,
    },
    changed,
    anchor,
  };
}

function rewriteGroupListInstanceNode(
  instanceNode: PMNode,
  instanceStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
): RewriteResult {
  const content: JSONContent[] = [];
  let changed = false;
  let anchor: AnchorPath | null = null;
  const contentStart = instanceStart + 1;
  let childIndex = 0;

  instanceNode.forEach((child, offset) => {
    const childStart = contentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (!rangesOverlap(childStart, childEnd, selectionFrom, selectionTo)) {
      content.push(copyNodeJSON(child));
      childIndex += 1;
      return;
    }

    const result = rewriteLayoutNode(
      child,
      childStart,
      selectionFrom,
      selectionTo,
      template,
    );
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(childIndex, result.anchor);
    }
    childIndex += 1;
  });

  return {
    json: {
      ...copyNodeJSON(instanceNode),
      content,
    },
    changed,
    anchor,
  };
}

function copyNodeJSON(node: PMNode): JSONContent {
  return node.toJSON() as JSONContent;
}

function trimParagraphJSON(
  paragraphNode: PMNode,
  deleteFrom: number,
  deleteTo: number,
): JSONContent {
  const before = paragraphNode.content.cut(0, deleteFrom);
  const after = paragraphNode.content.cut(deleteTo, paragraphNode.content.size);
  return buildParagraphFromFragments(paragraphNode, before, after);
}

function buildParagraphFromFragments(
  paragraphNode: PMNode,
  before: Fragment,
  after: Fragment,
): JSONContent {
  const content = [...fragmentToJSON(before), ...fragmentToJSON(after)];
  const json = paragraphNode.toJSON() as JSONContent;

  return content.length > 0 ? { ...json, content } : { ...json, content: undefined };
}

function clampOffset(offset: number, max: number): number {
  return Math.max(0, Math.min(offset, max));
}

function fragmentToJSON(fragment: Fragment): JSONContent[] {
  const content: JSONContent[] = [];
  fragment.forEach((node) => {
    content.push(node.toJSON() as JSONContent);
  });
  return content;
}

function rangesOverlap(
  start: number,
  end: number,
  selectionFrom: number,
  selectionTo: number,
): boolean {
  return Math.max(start, selectionFrom) < Math.min(end, selectionTo);
}

function isFullySelected(
  start: number,
  end: number,
  selectionFrom: number,
  selectionTo: number,
): boolean {
  return selectionFrom <= start && end <= selectionTo;
}

function prependPath(index: number, anchor: AnchorPath | null): AnchorPath | null {
  if (!anchor) return null;
  return {
    path: [index, ...anchor.path],
    textOffset: anchor.textOffset,
  };
}

function findFirstEditablePath(node: JSONContent): AnchorPath | null {
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

function findFirstEditablePathInContent(content: JSONContent[]): AnchorPath | null {
  for (let index = 0; index < content.length; index += 1) {
    const childAnchor = findFirstEditablePath(content[index]);
    if (childAnchor) {
      return prependPath(index, childAnchor);
    }
  }

  return null;
}

function findGroupListLayout(
  layout: Template["layout"],
  groupListId: string,
): Template["layout"] | null {
  for (const node of layout) {
    if (node.type !== "groupList") continue;
    if (node.groupListId === groupListId) {
      return node.layout;
    }

    const nested = findGroupListLayout(node.layout, groupListId);
    if (nested) return nested;
  }

  return null;
}
