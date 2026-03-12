import type { LayoutNode, TemplateSpec } from "@pepper-apply/shared";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { buildEmptyGroupListInstanceJSON } from "../document/build-empty-structure";
import { sanitizeHiddenIdsForLayout } from "../document/enforce-hidden";
import { findGroupListDefById } from "../schema/schema-helpers";
import {
  applyStoredMarksFromDefaultFormat,
  resolveNearestDefaultFormatFromPos,
} from "../../extensions/utils/default-format-marks";

type DocumentMeta = {
  templateSpec: TemplateSpec;
  groupListLayouts: Record<string, LayoutNode[]>;
};

const EDITABLE_NODE_NAMES = new Set(["field", "listItem", "inlineListItem"]);

function readDocumentMeta(editor: Editor): DocumentMeta | null {
  const storage = editor.storage as unknown as Record<string, unknown>;
  const rawMeta = storage.documentMeta;
  if (!rawMeta || typeof rawMeta !== "object") return null;

  const meta = rawMeta as Partial<DocumentMeta>;
  if (!meta.templateSpec || !meta.groupListLayouts) return null;

  return {
    templateSpec: meta.templateSpec as TemplateSpec,
    groupListLayouts: meta.groupListLayouts as Record<string, LayoutNode[]>,
  };
}

function findFirstEditableSelectionPos(
  instanceNode: PMNode,
  instanceStartPos: number,
): number | null {
  const contentStartPos = instanceStartPos + 1;
  let selectionPos: number | null = null;

  instanceNode.descendants((node, nodePos) => {
    if (selectionPos != null) {
      return false;
    }

    if (EDITABLE_NODE_NAMES.has(node.type.name)) {
      selectionPos = contentStartPos + nodePos + 2;
      return false;
    }

    return undefined;
  });

  return selectionPos;
}

function readInstanceHiddenIds(instanceNode: PMNode): string[] | undefined {
  const raw = instanceNode.attrs._hidden;
  if (!Array.isArray(raw)) return undefined;
  const hidden = raw.filter((id): id is string => typeof id === "string");
  return hidden.length > 0 ? hidden : undefined;
}

function resolveGroupListStartPosAtDepth(
  resolvedPos: ReturnType<PMNode["resolve"]>,
  depth: number,
): number {
  if (depth === 0) return 0;
  return resolvedPos.start(depth) - 1;
}

function resolveInsertIndex(
  groupListNode: PMNode,
  groupListContentStart: number,
  insertPos: number,
): number {
  let cursor = groupListContentStart;

  for (let index = 0; index < groupListNode.childCount; index += 1) {
    if (insertPos <= cursor) {
      return index;
    }

    cursor += groupListNode.child(index).nodeSize;
    if (insertPos <= cursor) {
      return index + 1;
    }
  }

  return groupListNode.childCount;
}

function inheritHiddenFromSibling(
  doc: PMNode,
  groupListId: string,
  insertPos: number,
  layout: LayoutNode[],
): string[] | undefined {
  const safeInsertPos = Math.max(0, Math.min(insertPos, doc.content.size));
  const resolvedPos = doc.resolve(safeInsertPos);

  for (let depth = resolvedPos.depth; depth >= 0; depth -= 1) {
    const nodeAtDepth = resolvedPos.node(depth);
    if (nodeAtDepth.type.name !== "groupList") continue;
    if ((nodeAtDepth.attrs.groupListId as string) !== groupListId) continue;

    const groupListStartPos = resolveGroupListStartPosAtDepth(resolvedPos, depth);
    const groupListContentStart = groupListStartPos + 1;
    const groupListContentEnd = groupListStartPos + nodeAtDepth.nodeSize - 1;
    if (safeInsertPos < groupListContentStart || safeInsertPos > groupListContentEnd) {
      continue;
    }

    if (nodeAtDepth.childCount === 0) {
      return undefined;
    }

    const insertIndex = resolveInsertIndex(
      nodeAtDepth,
      groupListContentStart,
      safeInsertPos,
    );
    const sourceIndex = insertIndex > 0 ? insertIndex - 1 : 0;
    const sourceSibling = nodeAtDepth.child(sourceIndex);
    return sanitizeHiddenIdsForLayout(readInstanceHiddenIds(sourceSibling), layout);
  }

  return undefined;
}

export function insertGroupListInstanceAt(
  editor: Editor,
  groupListId: string,
  insertPos: number,
): boolean {
  const meta = readDocumentMeta(editor);
  if (!meta) return false;
  const state = editor.state;
  const safeInsertPos = Math.max(0, Math.min(insertPos, state.doc.content.size));
  const groupListDef = findGroupListDefById(meta.templateSpec, groupListId);
  if (!groupListDef) return false;
  const layout = meta.groupListLayouts[groupListId];
  if (!layout) return false;
  const inheritedHidden = inheritHiddenFromSibling(
    state.doc,
    groupListId,
    safeInsertPos,
    layout,
  );
  const instanceJSON = buildEmptyGroupListInstanceJSON(
    groupListDef,
    layout,
    inheritedHidden,
  );
  let instanceNode: PMNode;
  try {
    instanceNode = state.schema.nodeFromJSON(instanceJSON);
  } catch {
    return false;
  }

  const tr = state.tr.insert(safeInsertPos, instanceNode);

  const firstEditablePos = findFirstEditableSelectionPos(instanceNode, safeInsertPos);
  const selectionPos = Math.max(
    1,
    Math.min(firstEditablePos ?? safeInsertPos + 1, tr.doc.content.size),
  );
  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));

  if (firstEditablePos != null) {
    const resolvedSelection = tr.doc.resolve(selectionPos);
    const defaultFormat = resolveNearestDefaultFormatFromPos(resolvedSelection);
    applyStoredMarksFromDefaultFormat(tr, state.schema, defaultFormat);
  }

  tr.scrollIntoView();

  editor.view.dispatch(tr);
  editor.view.focus();
  return true;
}
