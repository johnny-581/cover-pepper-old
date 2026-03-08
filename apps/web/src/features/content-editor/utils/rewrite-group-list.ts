import type { Template } from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  buildEmptyGroupListInstanceJSON,
  type JSONContent,
} from "./build-empty-structure";
import {
  findFirstEditablePath,
  isFullySelected,
  prependPath,
  rangesOverlap,
  type SelectionAnchor,
} from "./analyze-selection-helpers";
import {
  copyNodeJSON,
  hasTextContent,
  nodeWithContent,
  type RewriteResult,
} from "./node-json";
import { findGroupListDefById, findGroupListLayout } from "./schema-helpers";

type RewriteLayoutNode = (
  node: PMNode,
  nodeStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
) => RewriteResult;

export function rewriteGroupListNode(
  groupListNode: PMNode,
  groupListStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
  rewriteLayoutNode: RewriteLayoutNode,
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
  let anchor: SelectionAnchor | null = null;
  let emptyPartialRunActive = false;
  const groupListContentStart = groupListStart + 1;

  const flushEmptyPartialRun = () => {
    if (!emptyPartialRunActive) return;

    const emptyInstance = buildEmptyGroupListInstanceJSON(groupListDef, layout);
    const insertedIndex = content.length;
    content.push(emptyInstance);
    changed = true;
    if (!anchor) {
      anchor = prependPath(insertedIndex, findFirstEditablePath(emptyInstance));
    }
    emptyPartialRunActive = false;
  };

  groupListNode.forEach((child, offset) => {
    const childStart = groupListContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (!rangesOverlap(childStart, childEnd, selectionFrom, selectionTo)) {
      flushEmptyPartialRun();
      content.push(copyNodeJSON(child));
      return;
    }

    if (isFullySelected(childStart, childEnd, selectionFrom, selectionTo)) {
      flushEmptyPartialRun();
      changed = true;
      return;
    }

    const result = rewriteGroupListInstanceNode(
      child,
      childStart,
      selectionFrom,
      selectionTo,
      template,
      rewriteLayoutNode,
    );
    const shouldCollapsePartialInstance =
      result.changed && !hasTextContent(result.json);

    if (shouldCollapsePartialInstance) {
      emptyPartialRunActive = true;
      changed = true;
      return;
    }

    flushEmptyPartialRun();
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(content.length - 1, result.anchor);
    }
  });

  flushEmptyPartialRun();

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

function rewriteGroupListInstanceNode(
  instanceNode: PMNode,
  instanceStart: number,
  selectionFrom: number,
  selectionTo: number,
  template: Template,
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
    json: nodeWithContent(instanceNode, content),
    changed,
    anchor,
  };
}
