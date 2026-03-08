import { nanoid } from "nanoid";
import type {
  LayoutNode,
  Field,
  List,
  GroupListDef,
} from "@pepper-apply/shared";
import type { Node as PMNode } from "@tiptap/pm/model";

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

export function buildEmptyListItemJSON(): JSONContent {
  return {
    type: "listItem",
    content: [buildEmptyParagraphJSON()],
  };
}

export function buildEmptyListItemFromNodeJSON(_node: PMNode): JSONContent {
  void _node;
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
  return {
    ...json,
    content: [buildEmptyListItemJSON()],
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
            return buildEmptyListJSON(block, true);
          }
          return buildEmptyFieldJSON(block);
        }),
      };
    }

    if (node.type === "list") {
      return buildEmptyListJSON(node, false);
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
      font: block.style.font,
      background: block.style.background,
      bold: block.outputStyle.bold,
      italic: block.outputStyle.italic,
      underline: block.outputStyle.underline,
      placeholder: block.placeholder,
    },
    content: [buildEmptyParagraphJSON()],
  };
}

function buildEmptyListJSON(block: List, inline: boolean): JSONContent {
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
    content: [buildEmptyListItemJSON()],
  };
}
