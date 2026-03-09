import type { TemplateLayout, TemplateSpec } from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  buildEmptyGroupListInstanceJSON,
  type JSONContent,
} from "./build-empty-structure";
import {
  findFirstEditablePath,
  prependPath,
  rangesOverlap,
  type SelectionAnchor,
} from "./analyze-selection-helpers";
import {
  copyNodeJSON,
  nodeWithContent,
  type RewriteResult,
} from "./node-json";
import { findGroupListDefById, findGroupListLayout } from "./schema-helpers";

type RewriteLayoutNode = (
  node: PMNode,
  nodeStart: number,
  selectionFrom: number,
  selectionTo: number,
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
) => RewriteResult;

type GroupInstanceOverlap = "none" | "partial" | "full";

type GroupInstanceSelectionSlice = {
  node: PMNode;
  start: number;
  end: number;
  overlap: GroupInstanceOverlap;
};

export function rewriteGroupListNode(
  groupListNode: PMNode,
  groupListStart: number,
  selectionFrom: number,
  selectionTo: number,
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
  rewriteLayoutNode: RewriteLayoutNode,
): RewriteResult {
  const groupListId = groupListNode.attrs.groupListId as string;
  const groupListDef = findGroupListDefById(templateSpec, groupListId);
  if (!groupListDef) {
    throw new Error(`Unknown group list: ${groupListId}`);
  }

  const layout = findGroupListLayout(templateLayout, groupListId);
  if (!layout) {
    throw new Error(`Unknown group list layout: ${groupListId}`);
  }

  const slices = collectGroupInstanceSelectionSlices(
    groupListNode,
    groupListStart,
    selectionFrom,
    selectionTo,
  );

  const content: JSONContent[] = [];
  let changed = false;
  let partialAnchor: SelectionAnchor | null = null;
  let fullAnchor: SelectionAnchor | null = null;

  for (const slice of slices) {
    if (slice.overlap === "none") {
      content.push(copyNodeJSON(slice.node));
      continue;
    }

    if (slice.overlap === "full") {
      changed = true;
      if (
        selectionStartsInInstance(selectionFrom, slice.start, slice.end)
      ) {
        const emptyInstance = buildEmptyGroupListInstanceJSON(groupListDef, layout);
        const insertedIndex = content.length;
        content.push(emptyInstance);
        if (!fullAnchor) {
          fullAnchor = prependPath(
            insertedIndex,
            findFirstEditablePath(emptyInstance),
          );
        }
      }
      continue;
    }

    const result = rewriteGroupListInstanceNode(
      slice.node,
      slice.start,
      selectionFrom,
      selectionTo,
      templateSpec,
      templateLayout,
      rewriteLayoutNode,
    );
    content.push(result.json);
    changed ||= result.changed;
    if (!partialAnchor && result.anchor) {
      partialAnchor = prependPath(content.length - 1, result.anchor);
    }
  }

  let anchor = partialAnchor ?? fullAnchor;

  if (content.length === 0) {
    const emptyInstance = buildEmptyGroupListInstanceJSON(groupListDef, layout);
    content.push(emptyInstance);
    changed = true;
    anchor ??= prependPath(0, findFirstEditablePath(emptyInstance));
  }

  return {
    json: nodeWithContent(groupListNode, content),
    changed,
    anchor,
  };
}

function collectGroupInstanceSelectionSlices(
  groupListNode: PMNode,
  groupListStart: number,
  selectionFrom: number,
  selectionTo: number,
): GroupInstanceSelectionSlice[] {
  const slices: GroupInstanceSelectionSlice[] = [];
  const groupListContentStart = groupListStart + 1;

  groupListNode.forEach((child, offset) => {
    const childStart = groupListContentStart + offset;
    const childEnd = childStart + child.nodeSize;
    slices.push({
      node: child,
      start: childStart,
      end: childEnd,
      overlap: getGroupInstanceOverlap(
        child,
        childStart,
        childEnd,
        selectionFrom,
        selectionTo,
      ),
    });
  });

  return slices;
}

function getGroupInstanceOverlap(
  instanceNode: PMNode,
  instanceStart: number,
  instanceEnd: number,
  selectionFrom: number,
  selectionTo: number,
): GroupInstanceOverlap {
  if (!rangesOverlap(instanceStart, instanceEnd, selectionFrom, selectionTo)) {
    return "none";
  }

  const textRange = getNodeTextRange(instanceNode, instanceStart);
  if (
    textRange &&
    selectionFrom <= textRange.firstTextStart &&
    textRange.lastTextEnd <= selectionTo
  ) {
    return "full";
  }

  return "partial";
}

function getNodeTextRange(
  node: PMNode,
  nodeStart: number,
): { firstTextStart: number; lastTextEnd: number } | null {
  const contentStart = nodeStart + 1;
  let firstTextStart: number | null = null;
  let lastTextEnd: number | null = null;

  node.descendants((descendant, descendantPos) => {
    if (!descendant.isText || descendant.nodeSize <= 0) {
      return;
    }

    const textStart = contentStart + descendantPos;
    const textEnd = textStart + descendant.nodeSize;

    if (firstTextStart == null || textStart < firstTextStart) {
      firstTextStart = textStart;
    }
    if (lastTextEnd == null || textEnd > lastTextEnd) {
      lastTextEnd = textEnd;
    }
  });

  if (firstTextStart == null || lastTextEnd == null) {
    return null;
  }

  return { firstTextStart, lastTextEnd };
}

function selectionStartsInInstance(
  selectionFrom: number,
  instanceStart: number,
  instanceEnd: number,
): boolean {
  return selectionFrom >= instanceStart && selectionFrom <= instanceEnd;
}

function rewriteGroupListInstanceNode(
  instanceNode: PMNode,
  instanceStart: number,
  selectionFrom: number,
  selectionTo: number,
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
  rewriteLayoutNode: RewriteLayoutNode,
): RewriteResult {
  const content: JSONContent[] = [];
  let changed = false;
  let anchor: SelectionAnchor | null = null;
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
      templateSpec,
      templateLayout,
    );
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(childIndex, result.anchor);
    }
    childIndex += 1;
  });

  return {
    json: nodeWithContent(instanceNode, content),
    changed,
    anchor,
  };
}
