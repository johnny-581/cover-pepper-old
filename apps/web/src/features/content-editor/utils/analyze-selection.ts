import type { TemplateLayout, TemplateSpec } from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Selection } from "@tiptap/pm/state";
import {
  buildEmptyFieldFromNodeJSON,
  type JSONContent,
} from "./build-empty-structure";
import {
  computeDeleteWindow,
  findFirstEditablePath,
  findFirstEditablePathInContent,
  isFullySelected,
  prependPath,
  rangesOverlap,
  selectionStartsInText,
  type SelectionAnchor,
} from "./analyze-selection-helpers";
import {
  copyNodeJSON,
  nodeWithContent,
  trimParagraphJSON,
  unchanged,
  type RewriteResult,
} from "./node-json";
import { rewriteGroupListNode } from "./rewrite-group-list";
import { rewriteListNode } from "./rewrite-list";

export type SelectionAnalysis = {
  doc: JSONContent;
  anchor: SelectionAnchor;
};

type RewriteAccumulator = {
  content: JSONContent[];
  changed: boolean;
  anchor: SelectionAnchor | null;
};

export function analyzeSelection(
  doc: PMNode,
  selection: Selection,
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
): SelectionAnalysis | null {
  if (selection.empty) return null;

  const sameParagraphSelection =
    selection.$from.sameParent(selection.$to) &&
    selection.$from.parent.type.name === "paragraph";
  if (sameParagraphSelection) return null;

  const rewritten = rewriteChildrenContent(
    doc,
    0,
    selection.from,
    selection.to,
    (child, childStart) => {
      return rewriteLayoutNode(
        child,
        childStart,
        selection.from,
        selection.to,
        templateSpec,
        templateLayout,
      );
    },
  );

  if (!rewritten.changed) return null;

  return {
    doc: { type: "doc", content: rewritten.content },
    anchor: rewritten.anchor ??
      findFirstEditablePathInContent(rewritten.content) ?? {
        path: [],
        textOffset: 0,
      },
  };
}

function rewriteLayoutNode(
  node: PMNode,
  nodeStart: number,
  selectionFrom: number,
  selectionTo: number,
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
): RewriteResult {
  if (node.type.name === "row") {
    return rewriteRowNode(node, nodeStart, selectionFrom, selectionTo);
  }

  if (node.type.name === "list") {
    return rewriteListNode(node, nodeStart, selectionFrom, selectionTo);
  }

  if (node.type.name === "groupList") {
    return rewriteGroupListNode(
      node,
      nodeStart,
      selectionFrom,
      selectionTo,
      templateSpec,
      templateLayout,
      rewriteLayoutNode,
    );
  }

  return unchanged(node);
}

function rewriteRowNode(
  rowNode: PMNode,
  rowStart: number,
  selectionFrom: number,
  selectionTo: number,
): RewriteResult {
  const rewritten = rewriteChildrenContent(
    rowNode,
    rowStart + 1,
    selectionFrom,
    selectionTo,
    (child, childStart) => {
      if (child.type.name === "decorator") {
        return unchanged(child);
      }

      if (child.type.name === "field") {
        return rewriteFieldNode(child, childStart, selectionFrom, selectionTo);
      }

      if (child.type.name === "list") {
        return rewriteListNode(child, childStart, selectionFrom, selectionTo);
      }

      return unchanged(child);
    },
  );

  return {
    json: nodeWithContent(rowNode, rewritten.content),
    changed: rewritten.changed,
    anchor: rewritten.anchor,
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
    return unchanged(fieldNode);
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
    return unchanged(fieldNode);
  }

  const paragraphTextStart = fieldStart + 2;
  const {
    deleteFrom,
    deleteTo,
    textEnd: paragraphTextEnd,
  } = computeDeleteWindow(
    paragraphTextStart,
    paragraph.content.size,
    selectionFrom,
    selectionTo,
  );

  if (deleteFrom >= deleteTo) {
    return unchanged(fieldNode);
  }

  const json = nodeWithContent(fieldNode, [
    trimParagraphJSON(paragraph, deleteFrom, deleteTo),
  ]);

  return {
    json,
    changed: true,
    anchor: selectionStartsInText(
      selectionFrom,
      paragraphTextStart,
      paragraphTextEnd,
    )
      ? { path: [0], textOffset: deleteFrom }
      : null,
  };
}

function rewriteChildrenContent(
  parent: PMNode,
  parentContentStart: number,
  selectionFrom: number,
  selectionTo: number,
  rewriteChild: (
    child: PMNode,
    childStart: number,
    childEnd: number,
    childIndex: number,
  ) => RewriteResult,
): RewriteAccumulator {
  const content: JSONContent[] = [];
  let changed = false;
  let anchor: SelectionAnchor | null = null;
  let childIndex = 0;

  parent.forEach((child, offset) => {
    const childStart = parentContentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (!rangesOverlap(childStart, childEnd, selectionFrom, selectionTo)) {
      content.push(copyNodeJSON(child));
      childIndex += 1;
      return;
    }

    const result = rewriteChild(child, childStart, childEnd, childIndex);
    content.push(result.json);
    changed ||= result.changed;
    if (!anchor && result.anchor) {
      anchor = prependPath(childIndex, result.anchor);
    }
    childIndex += 1;
  });

  return { content, changed, anchor };
}
