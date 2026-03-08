import type {
  Template,
  FileContent,
  GroupListInstance,
  LayoutNode,
  RowBlock,
  Field,
  List,
  GroupListDef,
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
  groupLists: Record<string, GroupListInstance[]>;
};

export function buildDocument(
  template: Template,
  content: FileContent,
): JSONContent {
  return {
    type: "doc",
    content: buildLayoutNodes(
      template.layout,
      content,
      template.groupLists,
    ),
  };
}

function buildLayoutNodes(
  layout: LayoutNode[],
  scope: Scope,
  groupListDefs: GroupListDef[],
): JSONContent[] {
  return layout.map((node) => {
    if (node.type === "row") {
      return buildRow(node.blocks, scope);
    }
    if (node.type === "list") {
      return buildList(node, scope, false);
    }
    // groupList
    const groupListDef = groupListDefs.find((g) => g.id === node.groupListId);
    if (!groupListDef)
      throw new Error(`Unknown group list: ${node.groupListId}`);
    return buildGroupList(node.groupListId, groupListDef, node.layout, scope);
  });
}

function buildRow(
  blocks: RowBlock[],
  scope: Scope,
): JSONContent {
  return {
    type: "row",
    content: blocks.map((block) => {
      if (block.type === "decorator") {
        return { type: "decorator", attrs: { text: block.text } };
      }
      if (block.type === "list") {
        return buildList(block, scope, true);
      }
      return buildField(block, scope);
    }),
  };
}

function buildField(
  block: Field,
  scope: Scope,
): JSONContent {
  const html = scope.fields[block.fieldId] ?? "";
  return {
    type: "field",
    attrs: {
      fieldId: block.fieldId,
      sizing: block.sizing,
      font: block.style.font,
      background: block.style.background,
      bold: block.outputStyle.bold,
      italic: block.outputStyle.italic,
      underline: block.outputStyle.underline,
      placeholder: block.placeholder,
    },
    content: [htmlToParagraph(html)],
  };
}

function buildList(
  block: List,
  scope: Scope,
  inline: boolean,
): JSONContent {
  const items = scope.lists[block.listId] ?? [];
  const actualItems = items.length > 0 ? items : [""];
  return {
    type: "list",
    attrs: {
      listId: block.listId,
      inline,
      sizing: block.sizing,
      display: block.display,
      placeholder: block.placeholder,
      font: block.itemStyle.font,
      bold: block.itemStyle.outputStyle.bold,
      italic: block.itemStyle.outputStyle.italic,
      underline: block.itemStyle.outputStyle.underline,
    },
    content: actualItems.map((html) => ({
      type: "listItem",
      content: [htmlToParagraph(html)],
    })),
  };
}

function buildGroupList(
  groupListId: string,
  groupListDef: GroupListDef,
  layout: LayoutNode[],
  scope: Scope,
): JSONContent {
  const instances = scope.groupLists[groupListId] ?? [];
  return {
    type: "groupList",
    attrs: { groupListId },
    content: instances.map((instance) => ({
      type: "groupListInstance",
      attrs: { instanceKey: instance._key },
      content: buildLayoutNodes(
        layout,
        instance,
        groupListDef.groupLists,
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
