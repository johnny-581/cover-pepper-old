import { nanoid } from "nanoid";
import type {
  LayoutNode,
  Field,
  List,
  InlineList,
  GroupListDef,
  ListItemStyle,
} from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";

export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type ListKind = "block" | "inlineCompat";

type ListLikeBlock = List | InlineList;

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

  return node.toJSON() as JSONContent;
}

export function buildEmptyGroupListInstanceJSON(
  groupListDef: GroupListDef,
  layout: LayoutNode[],
): JSONContent {
  return {
    type: "groupListInstance",
    attrs: { instanceKey: nanoid(8) },
    content: buildEmptyLayoutNodes(layout, groupListDef.groupLists),
  };
}

function buildEmptyLayoutNodes(
  layout: LayoutNode[],
  groupListDefs: GroupListDef[],
): JSONContent[] {
  return layout.map((node) => {
    if (node.type === "row") {
      return {
        type: "row",
        content: node.blocks.map((block) => {
          if (block.type === "decorator") {
            return { type: "decorator", attrs: { text: block.text } };
          }

          if (block.type === "list") {
            return buildEmptyListJSON(block, "block");
          }

          if (block.type === "inlinelist") {
            return buildEmptyListJSON(block, "inlineCompat");
          }

          return buildEmptyFieldJSON(block);
        }),
      };
    }

    if (node.type === "list") {
      return buildEmptyListJSON(node, "block");
    }

    if (node.type === "inlinelist") {
      return buildEmptyListJSON(node, "inlineCompat");
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
  });
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

function buildEmptyListJSON(block: ListLikeBlock, listKind: ListKind): JSONContent {
  const defaultItemStyle = resolveDefaultItemStyle(block, listKind);

  return {
    type: "list",
    attrs: {
      listId: block.listId,
      listKind,
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

function resolveDefaultItemStyle(
  block: ListLikeBlock,
  listKind: ListKind,
): ListItemStyle {
  if (listKind === "inlineCompat") {
    return "plain";
  }

  return block.type === "list" ? block.defaultItemStyle ?? "plain" : "plain";
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
