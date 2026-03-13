import { nanoid } from "nanoid";
import type {
  GroupList,
  LayoutNode,
  BlockGroup,
  Field,
  List,
  InlineList,
  GroupListDef,
  RowBlock,
  ListItemStyle,
} from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  filterHiddenRowBlocks,
  hiddenTargetId,
  sanitizeHiddenIdsForLayout,
} from "./enforce-hidden";

export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export function buildEmptyParagraphJSON(): JSONContent {
  return { type: "paragraph" };
}

export function buildEmptyFieldParagraphJSON(): JSONContent {
  return buildEmptyParagraphJSON();
}

export function buildEmptyListItemJSON(style: ListItemStyle = "plain"): JSONContent {
  return {
    type: "listItem",
    attrs: { style },
    content: [buildEmptyParagraphJSON()],
  };
}

export function buildEmptyInlineListItemJSON(): JSONContent {
  return {
    type: "inlineListItem",
    content: [buildEmptyParagraphJSON()],
  };
}

export function buildEmptyListItemFromNodeJSON(node: PMNode): JSONContent {
  if (node.type.name === "listItem") {
    return buildEmptyListItemJSON(normalizeListItemStyle(node.attrs.style, "plain"));
  }

  if (node.type.name === "list") {
    return buildEmptyListItemJSON(
      normalizeListItemStyle(node.attrs.defaultItemStyle, "plain"),
    );
  }

  return buildEmptyListItemJSON();
}

export function buildEmptyInlineListItemFromNodeJSON(node: PMNode): JSONContent {
  if (node.type.name === "inlineListItem") {
    return buildEmptyInlineListItemJSON();
  }

  if (node.type.name === "inlineList") {
    return buildEmptyInlineListItemJSON();
  }

  return buildEmptyInlineListItemJSON();
}

export function buildEmptyFieldFromNodeJSON(node: PMNode): JSONContent {
  const json = node.toJSON() as JSONContent;
  return {
    ...json,
    content: [buildEmptyParagraphJSON()],
  };
}

export function buildEmptyListFromNodeJSON(node: PMNode): JSONContent {
  const json = node.toJSON() as JSONContent;
  const style = normalizeListItemStyle(node.attrs.defaultItemStyle, "plain");
  return {
    ...json,
    content: [buildEmptyListItemJSON(style)],
  };
}

export function buildEmptyInlineListFromNodeJSON(node: PMNode): JSONContent {
  const json = node.toJSON() as JSONContent;
  return {
    ...json,
    content: [buildEmptyInlineListItemJSON()],
  };
}

export function rewriteRowChildJSON(
  node: PMNode,
  mode: "copy" | "empty",
): JSONContent {
  if (mode === "copy") {
    return node.toJSON() as JSONContent;
  }

  if (node.type.name === "field") {
    return buildEmptyFieldFromNodeJSON(node);
  }

  if (node.type.name === "list") {
    return buildEmptyListFromNodeJSON(node);
  }

  if (node.type.name === "inlineList") {
    return buildEmptyInlineListFromNodeJSON(node);
  }

  return node.toJSON() as JSONContent;
}

export function buildEmptyGroupListInstanceJSON(
  groupListDef: GroupListDef,
  layout: GroupList["layout"],
  hiddenIds?: string[],
): JSONContent {
  const sanitizedHidden = sanitizeHiddenIdsForLayout(hiddenIds, layout);
  const hiddenSet = new Set(sanitizedHidden ?? []);

  return {
    type: "groupListInstance",
    attrs: {
      instanceKey: nanoid(8),
      _hidden: sanitizedHidden,
    },
    content: buildEmptyLayoutNodes(layout, groupListDef.groupLists, hiddenSet),
  };
}

function buildEmptyLayoutNodes(
  layout: LayoutNode[],
  groupListDefs: GroupListDef[],
  hiddenIds: Set<string> = new Set<string>(),
): JSONContent[] {
  return layout
    .map((node) => {
      if (node.type === "row") {
        return buildEmptyRowJSON(node.blocks, hiddenIds);
      }

      if (node.type === "list") {
        if (isHidden(node, hiddenIds)) {
          return null;
        }
        return buildEmptyListJSON(node);
      }

      if (node.type === "inlinelist") {
        if (isHidden(node, hiddenIds)) {
          return null;
        }
        return buildEmptyInlineListJSON(node);
      }

      const groupListDef = groupListDefs.find((group) => group.id === node.groupListId);
      if (!groupListDef) {
        throw new Error(`Unknown group list: ${node.groupListId}`);
      }

      return {
        type: "groupList",
        attrs: { groupListId: node.groupListId },
        content: [buildEmptyGroupListInstanceJSON(groupListDef, node.layout)],
      };
    })
    .filter((node): node is JSONContent => node !== null);
}

function buildEmptyRowJSON(
  blocks: RowBlock[],
  hiddenIds: Set<string>,
): JSONContent | null {
  const rowBlocks = hiddenIds.size > 0
    ? filterHiddenRowBlocks(blocks, hiddenIds)
    : blocks;

  if (rowBlocks.length === 0) {
    return null;
  }

  return {
    type: "row",
    content: rowBlocks.map((block) => buildEmptyRowBlockJSON(block)),
  };
}

function buildEmptyRowBlockJSON(block: RowBlock): JSONContent {
  if (block.type === "decorator") {
    return { type: "decorator", attrs: { text: block.text } };
  }

  if (block.type === "list") {
    return buildEmptyListJSON(block);
  }

  if (block.type === "inlinelist") {
    return buildEmptyInlineListJSON(block);
  }

  if (block.type === "group") {
    return buildEmptyBlockGroupJSON(block);
  }

  return buildEmptyFieldJSON(block);
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

function buildEmptyFieldJSON(block: Field): JSONContent {
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
    content: [buildEmptyParagraphJSON()],
  };
}

function buildEmptyListJSON(block: List): JSONContent {
  const defaultItemStyle = block.defaultItemStyle ?? "plain";

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
    content: [buildEmptyListItemJSON(defaultItemStyle)],
  };
}

function buildEmptyInlineListJSON(block: InlineList): JSONContent {
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
    content: [buildEmptyInlineListItemJSON()],
  };
}

function buildEmptyBlockGroupJSON(block: BlockGroup): JSONContent {
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
        return buildEmptyInlineListJSON(withHugSizing(child));
      }

      return buildEmptyFieldJSON(withHugSizing(child));
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

function normalizeListItemStyle(
  style: unknown,
  fallback: ListItemStyle,
): ListItemStyle {
  if (style === "plain" || style === "bullet" || style === "numbered") {
    return style;
  }

  return fallback;
}
