import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import type {
  LayoutRow,
  FieldBlock,
  GroupDef,
  ListDef,
} from "@pepper-apply/shared";

type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses")) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function GroupSectionView({ node, editor, getPos }: NodeViewProps) {
  const groupId = node.attrs.groupId as string;

  const handleAddInstance = () => {
    const pos = getPos();
    if (pos == null) return;

    const meta = (editor.storage as unknown as Record<string, unknown>).documentMeta as {
      templateSchema: { groups: GroupDef[] };
      groupLayouts: Record<string, LayoutRow[]>;
    };
    if (!meta) return;

    const groupDef = findGroupDefById(meta.templateSchema.groups, groupId);
    if (!groupDef) return;

    const layout = meta.groupLayouts[groupId];
    if (!layout) return;

    const instanceJSON = buildEmptyGroupInstanceJSON(groupDef, layout);

    // Insert at end of this groupSection's content
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
        Add {singularize(groupId)}
      </button>
    </NodeViewWrapper>
  );
}

function findGroupDefById(
  groups: GroupDef[],
  groupId: string,
): GroupDef | null {
  for (const g of groups) {
    if (g.id === groupId) return g;
    const found = findGroupDefById(g.groups, groupId);
    if (found) return found;
  }
  return null;
}

function buildEmptyGroupInstanceJSON(
  groupDef: GroupDef,
  layout: LayoutRow[],
): JSONContent {
  const emptyScope = {
    fields: Object.fromEntries(groupDef.fields.map((f) => [f.id, ""])),
    lists: Object.fromEntries(groupDef.lists.map((l) => [l.id, [""]])),
    groups: Object.fromEntries(groupDef.groups.map((g) => [g.id, []])),
  };

  return {
    type: "groupInstance",
    attrs: { instanceKey: nanoid(8) },
    content: buildLayoutRows(layout, emptyScope, groupDef.groups, groupDef.lists),
  };
}

// Minimal re-implementation of build-document logic for creating empty instances
type Scope = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, { _key: string }[]>;
};

function buildLayoutRows(
  layout: LayoutRow[],
  scope: Scope,
  groupDefs: GroupDef[],
  listDefs: ListDef[],
): JSONContent[] {
  return layout.map((row) => {
    if (row.type === "fieldRow") {
      return {
        type: "fieldRow",
        content: row.blocks.map((block) => {
          if (block.type === "decorator") {
            return { type: "decoratorBlock", attrs: { text: block.text } };
          }
          return buildFieldBlock(block, scope, listDefs);
        }),
      };
    }
    const groupDef = groupDefs.find((g) => g.id === row.groupId);
    if (!groupDef) return { type: "fieldRow", content: [] };
    const instances = (scope.groups[row.groupId] ?? []) as { _key: string }[];
    return {
      type: "groupSection",
      attrs: { groupId: row.groupId },
      content:
        instances.length > 0
          ? instances.map((inst) => ({
              type: "groupInstance",
              attrs: { instanceKey: inst._key },
              content: buildLayoutRows(
                row.layout,
                { fields: {}, lists: {}, groups: {} },
                groupDef.groups,
                groupDef.lists,
              ),
            }))
          : [
              {
                type: "groupInstance",
                attrs: { instanceKey: nanoid(8) },
                content: buildLayoutRows(
                  row.layout,
                  { fields: {}, lists: {}, groups: {} },
                  groupDef.groups,
                  groupDef.lists,
                ),
              },
            ],
    };
  });
}

function buildFieldBlock(
  block: FieldBlock,
  scope: Scope,
  listDefs: ListDef[],
): JSONContent {
  const listDef = listDefs.find((l) => l.id === block.fieldId);
  const isList = !!listDef;

  const attrs = {
    fieldId: block.fieldId,
    sizing: block.sizing,
    font: block.style.font,
    background: block.style.background,
    display: block.style.display,
    bold: block.outputStyle.bold,
    italic: block.outputStyle.italic,
    underline: block.outputStyle.underline,
    placeholder: block.placeholder,
    isList,
    listId: listDef?.id ?? null,
  };

  if (isList) {
    const items = scope.lists[listDef!.id] ?? [""];
    return {
      type: "fieldBlock",
      attrs,
      content: [
        {
          type: "contentList",
          content: items.map(() => ({
            type: "contentListItem",
            content: [{ type: "paragraph" }],
          })),
        },
      ],
    };
  }

  return {
    type: "fieldBlock",
    attrs,
    content: [{ type: "paragraph" }],
  };
}
