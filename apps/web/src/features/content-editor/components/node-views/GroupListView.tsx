import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Plus } from "lucide-react";
import type { LayoutNode, Template } from "@pepper-apply/shared";
import { buildEmptyGroupListInstanceJSON } from "../../utils/build-empty-structure";
import { findGroupListDefById } from "../../utils/schema-helpers";

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses")) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function GroupListView({ node, editor, getPos }: NodeViewProps) {
  const groupListId = node.attrs.groupListId as string;

  const handleAddInstance = () => {
    const pos = getPos();
    if (pos == null) return;

    const meta = (editor.storage as unknown as Record<string, unknown>)
      .documentMeta as {
      template: Template;
      groupListLayouts: Record<string, LayoutNode[]>;
    };
    if (!meta) return;

    const groupListDef = findGroupListDefById(meta.template, groupListId);
    if (!groupListDef) return;

    const layout = meta.groupListLayouts[groupListId];
    if (!layout) return;

    const instanceJSON = buildEmptyGroupListInstanceJSON(groupListDef, layout);

    // Insert at end of this group list's content
    const insertPos = pos + node.nodeSize - 1;
    editor.commands.insertContentAt(insertPos, instanceJSON);
  };

  return (
    <NodeViewWrapper className="flex flex-col gap-1">
      <NodeViewContent />
      <button
        type="button"
        onClick={handleAddInstance}
        contentEditable={false}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded hover:bg-muted w-fit"
      >
        <Plus className="h-3 w-3" />
        Add {singularize(groupListId)}
      </button>
    </NodeViewWrapper>
  );
}
