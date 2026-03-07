import type {
  TemplateSchema,
  FileContent,
  GroupInstance,
  LayoutRow,
  LayoutBlock,
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

type Scope = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, GroupInstance[]>;
};

export function buildDocument(
  schema: TemplateSchema,
  content: FileContent,
): JSONContent {
  return {
    type: "doc",
    content: buildLayoutRows(
      schema.layout,
      content,
      schema.groups,
      schema.lists,
    ),
  };
}

function buildLayoutRows(
  layout: LayoutRow[],
  scope: Scope,
  groupDefs: GroupDef[],
  listDefs: ListDef[],
): JSONContent[] {
  return layout.map((row) => {
    if (row.type === "fieldRow") {
      return buildFieldRow(row.blocks, scope, listDefs);
    }
    const groupDef = groupDefs.find((g) => g.id === row.groupId);
    if (!groupDef)
      throw new Error(`Unknown group: ${row.groupId}`);
    return buildGroupSection(row.groupId, groupDef, row.layout, scope);
  });
}

function buildFieldRow(
  blocks: LayoutBlock[],
  scope: Scope,
  listDefs: ListDef[],
): JSONContent {
  return {
    type: "fieldRow",
    content: blocks.map((block) => {
      if (block.type === "decorator") {
        return {
          type: "decoratorBlock",
          attrs: { text: block.text },
        };
      }
      return buildFieldBlock(block, scope, listDefs);
    }),
  };
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
    const items = scope.lists[listDef!.id] ?? [];
    const actualItems = items.length > 0 ? items : [""];
    return {
      type: "fieldBlock",
      attrs,
      content: [
        {
          type: "contentList",
          content: actualItems.map((html) => ({
            type: "contentListItem",
            content: [htmlToParagraph(html)],
          })),
        },
      ],
    };
  }

  const html = scope.fields[block.fieldId] ?? "";
  return {
    type: "fieldBlock",
    attrs,
    content: [htmlToParagraph(html)],
  };
}

function buildGroupSection(
  groupId: string,
  groupDef: GroupDef,
  layout: LayoutRow[],
  scope: Scope,
): JSONContent {
  const instances = scope.groups[groupId] ?? [];
  return {
    type: "groupSection",
    attrs: { groupId },
    content: instances.map((instance) => ({
      type: "groupInstance",
      attrs: { instanceKey: instance._key },
      content: buildLayoutRows(
        layout,
        instance,
        groupDef.groups,
        groupDef.lists,
      ),
    })),
  };
}

/**
 * Convert an inline HTML string to a PM paragraph JSONContent.
 * Parses <b>, <i>, <a> tags into TipTap marks.
 */
function htmlToParagraph(html: string): JSONContent {
  if (!html) {
    return { type: "paragraph" };
  }

  const content = parseInlineHTML(html);
  if (content.length === 0) {
    return { type: "paragraph" };
  }

  return { type: "paragraph", content };
}

/**
 * Parse inline HTML string into an array of TipTap text nodes with marks.
 * Handles <b>, <i>, <a href="...">, and nested combinations.
 */
function parseInlineHTML(html: string): JSONContent[] {
  const results: JSONContent[] = [];

  // Use a temporary DOM parser
  const template = document.createElement("template");
  template.innerHTML = html;

  function walk(node: ChildNode, marks: JSONContent["marks"]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length === 0) return;
      const textNode: JSONContent = { type: "text", text };
      if (marks && marks.length > 0) {
        textNode.marks = [...marks];
      }
      results.push(textNode);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const newMarks = [...(marks ?? [])];

      if (tag === "b" || tag === "strong") {
        newMarks.push({ type: "bold" });
      } else if (tag === "i" || tag === "em") {
        newMarks.push({ type: "italic" });
      } else if (tag === "a") {
        newMarks.push({
          type: "link",
          attrs: {
            href: el.getAttribute("href") ?? "",
            target: el.getAttribute("target") ?? "_blank",
          },
        });
      }

      for (const child of el.childNodes) {
        walk(child, newMarks);
      }
    }
  }

  for (const child of template.content.childNodes) {
    walk(child, []);
  }

  return results;
}
