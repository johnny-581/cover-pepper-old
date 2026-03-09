import type { LayoutNode, TemplateSpec } from "@pepper-apply/shared";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { buildEmptyGroupListInstanceJSON } from "./build-empty-structure";
import { findGroupListDefById } from "./schema-helpers";

type DocumentMeta = {
  templateSpec: TemplateSpec;
  groupListLayouts: Record<string, LayoutNode[]>;
};

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

function buildGroupListInstanceNode(
  editor: Editor,
  groupListId: string,
): PMNode | null {
  const meta = readDocumentMeta(editor);
  if (!meta) return null;

  const groupListDef = findGroupListDefById(meta.templateSpec, groupListId);
  if (!groupListDef) return null;

  const layout = meta.groupListLayouts[groupListId];
  if (!layout) return null;

  const instanceJSON = buildEmptyGroupListInstanceJSON(groupListDef, layout);
  try {
    return editor.state.schema.nodeFromJSON(instanceJSON);
  } catch {
    return null;
  }
}

export function insertGroupListInstanceAt(
  editor: Editor,
  groupListId: string,
  insertPos: number,
): boolean {
  const instanceNode = buildGroupListInstanceNode(editor, groupListId);
  if (!instanceNode) return false;

  const state = editor.state;
  const safeInsertPos = Math.max(0, Math.min(insertPos, state.doc.content.size));
  const tr = state.tr.insert(safeInsertPos, instanceNode);

  const selectionPos = Math.max(
    1,
    Math.min(safeInsertPos + 1, tr.doc.content.size),
  );
  tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1)).scrollIntoView();

  editor.view.dispatch(tr);
  editor.view.focus();
  return true;
}
