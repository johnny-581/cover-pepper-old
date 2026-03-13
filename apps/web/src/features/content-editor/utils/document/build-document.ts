import type {
  FileContent,
  GroupListInstance,
  GroupList,
  LayoutNode,
  RowBlock,
  BlockGroup,
  Field,
  List,
  InlineList,
  GroupListDef,
  TemplateLayout,
  TemplateSpec,
  ListItem,
  ListItemStyle,
} from "@pepper-apply/shared";
import {
  enforceHidden,
  filterGroupBlocks,
  filterHiddenRowBlocks,
  hiddenTargetId,
} from "./enforce-hidden";

type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type Scope = {
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};

export function buildDocument(
  templateSpec: TemplateSpec,
  templateLayout: TemplateLayout,
  content: FileContent,
): JSONContent {
  return {
    type: "doc",
    content: buildLayoutNodes(
      templateLayout,
      content,
      templateSpec.groupLists,
    ),
  };
}

function buildLayoutNodes(
  layout: LayoutNode[],
  scope: Scope,
  groupListDefs: GroupListDef[],
  hiddenIds: Set<string> = new Set<string>(),
): JSONContent[] {
  return layout
    .map((node) => {
      if (node.type === "row") {
        return buildRow(node.blocks, scope, hiddenIds);
      }

      if (node.type === "list") {
        if (isHidden(node, hiddenIds)) {
          return null;
        }
        return buildList(node, scope);
      }

      if (node.type === "inlinelist") {
        if (isHidden(node, hiddenIds)) {
          return null;
        }
        return buildInlineList(node, scope);
      }

      const groupListDef = groupListDefs.find((g) => g.id === node.groupListId);
      if (!groupListDef) {
        throw new Error(`Unknown group list: ${node.groupListId}`);
      }

      return buildGroupList(node.groupListId, groupListDef, node.layout, scope);
    })
    .filter((node): node is JSONContent => node !== null);
}

function buildRow(
  blocks: RowBlock[],
  scope: Scope,
  hiddenIds: Set<string>,
): JSONContent | null {
  const rowBlocks = hiddenIds.size > 0
    ? filterHiddenRowBlocks(blocks, hiddenIds)
    : normalizeRowGroups(blocks);

  if (rowBlocks.length === 0) {
    return null;
  }

  return {
    type: "row",
    content: rowBlocks.map((block) => buildRowBlock(block, scope)),
  };
}

function normalizeRowGroups(blocks: RowBlock[]): RowBlock[] {
  const normalizedBlocks: RowBlock[] = [];

  for (const block of blocks) {
    if (block.type !== "group") {
      normalizedBlocks.push(block);
      continue;
    }

    const visibleChildren = filterGroupBlocks(block.blocks);
    if (visibleChildren.length === 0) {
      continue;
    }

    if (visibleChildren.length === block.blocks.length) {
      normalizedBlocks.push(block);
      continue;
    }

    normalizedBlocks.push({
      ...block,
      blocks: visibleChildren,
    });
  }

  return normalizedBlocks;
}

function buildRowBlock(
  block: RowBlock,
  scope: Scope,
): JSONContent {
  if (block.type === "decorator") {
    return { type: "decorator", attrs: { text: block.text } };
  }

  if (block.type === "list") {
    return buildList(block, scope);
  }

  if (block.type === "inlinelist") {
    return buildInlineList(block, scope);
  }

  if (block.type === "group") {
    return buildBlockGroup(block, scope);
  }

  return buildField(block, scope);
}

function isHidden(
  block: List | InlineList | RowBlock,
  hiddenIds: Set<string>,
): boolean {
  if (hiddenIds.size === 0) {
    return false;
  }

  const id = hiddenTargetId(block);
  if (!id) return false;
  return hiddenIds.has(id);
}

function buildGroupList(
  groupListId: string,
  groupListDef: GroupListDef,
  layout: GroupList["layout"],
  scope: Scope,
): JSONContent {
  const instances = scope.groupLists[groupListId] ?? [];

  return {
    type: "groupList",
    attrs: { groupListId },
    content: instances.map((instance) => {
      const nextInstance: GroupListInstance = {
        ...instance,
        _hidden: instance._hidden ? [...instance._hidden] : undefined,
      };
      enforceHidden(nextInstance, layout);
      const instanceHidden = new Set(nextInstance._hidden ?? []);

      return {
        type: "groupListInstance",
        attrs: {
          instanceKey: nextInstance._key,
          _hidden: nextInstance._hidden,
        },
        content: buildLayoutNodes(
          layout,
          nextInstance,
          groupListDef.groupLists,
          instanceHidden,
        ),
      };
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
      font: block.font ?? "sans",
      size: block.size ?? "normal",
      background: block.background ?? "none",
      defaultFormat: block.defaultFormat ?? {},
      hideable: block.hideable ?? false,
      placeholder: block.placeholder ?? "",
    },
    content: [htmlToParagraph(html)],
  };
}

function buildList(
  block: List,
  scope: Scope,
): JSONContent {
  const defaultItemStyle = block.defaultItemStyle ?? "plain";
  const configuredItems = toBlockListItems(
    scope.lists[block.listId] ?? [],
    defaultItemStyle,
  );
  const items = configuredItems.length > 0
    ? configuredItems
    : [{ style: defaultItemStyle, text: "" }];

  return {
    type: "list",
    attrs: {
      listId: block.listId,
      sizing: block.sizing,
      font: block.font ?? "sans",
      size: block.size ?? "normal",
      background: block.background ?? "none",
      defaultFormat: block.defaultFormat ?? {},
      defaultItemStyle,
      hideable: block.hideable ?? false,
      placeholder: block.placeholder ?? "",
    },
    content: items.map((item) => ({
      type: "listItem",
      attrs: {
        style: item.style,
      },
      content: [htmlToParagraph(item.text)],
    })),
  };
}

function buildInlineList(
  block: InlineList,
  scope: Scope,
): JSONContent {
  const items = scope.inlineLists[block.listId] ?? [];
  const configuredItems = items.length > 0 ? items : [""];

  return {
    type: "inlineList",
    attrs: {
      listId: block.listId,
      sizing: block.sizing,
      font: block.font ?? "sans",
      size: block.size ?? "normal",
      background: block.background ?? "none",
      defaultFormat: block.defaultFormat ?? {},
      hideable: block.hideable ?? false,
      placeholder: block.placeholder ?? "",
    },
    content: configuredItems.map((item) => ({
      type: "inlineListItem",
      content: [htmlToParagraph(item)],
    })),
  };
}

function buildBlockGroup(
  block: BlockGroup,
  scope: Scope,
): JSONContent {
  return {
    type: "blockGroup",
    attrs: {
      sizing: block.sizing,
    },
    content: block.blocks.map((child) => {
      if (child.type === "decorator") {
        return { type: "decorator", attrs: { text: child.text } };
      }

      if (child.type === "inlinelist") {
        return buildInlineList(withHugSizing(child), scope);
      }

      return buildField(withHugSizing(child), scope);
    }),
  };
}

function withHugSizing<T extends Field | InlineList>(block: T): T {
  if (block.sizing === "hug") {
    return block;
  }

  return {
    ...block,
    sizing: "hug",
  };
}

function toBlockListItems(
  items: ListItem[],
  fallbackStyle: ListItemStyle,
): ListItem[] {
  return items.map((item) => ({
    style: normalizeListItemStyle(item.style, fallbackStyle),
    text: item.text ?? "",
  }));
}

function normalizeListItemStyle(
  style: unknown,
  fallback: ListItemStyle,
): ListItemStyle {
  if (style === "plain" || style === "bullet" || style === "numbered") {
    return style;
  }

  return fallback;
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
 * Handles <b>, <i>, <u>, <a href="...">, and nested combinations.
 */
function parseInlineHTML(html: string): JSONContent[] {
  const results: JSONContent[] = [];

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
      } else if (tag === "u") {
        newMarks.push({ type: "underline" });
      } else if (tag === "span" && hasUnderlineStyle(el.getAttribute("style"))) {
        newMarks.push({ type: "underline" });
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

function hasUnderlineStyle(style: string | null): boolean {
  if (!style) return false;

  return /text-decoration(?:-line)?\s*:\s*[^;]*underline/i.test(style);
}
