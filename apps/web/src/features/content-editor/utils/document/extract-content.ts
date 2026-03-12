import type { Node as PMNode } from "@tiptap/pm/model";
import type {
  FileContent,
  GroupListInstance,
  LayoutNode,
  ListItem,
  ListItemStyle,
} from "@pepper-apply/shared";
import { enforceHidden } from "./enforce-hidden";

type Scope = {
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};

let hasWarnedAboutMalformedField = false;

export function extractContent(
  doc: PMNode,
  groupListLayouts: Record<string, LayoutNode[]> = {},
): FileContent {
  const result: FileContent = {
    fields: {},
    lists: {},
    inlineLists: {},
    groupLists: {},
  };

  doc.forEach((topNode) => {
    extractLayoutNode(topNode, result, groupListLayouts);
  });

  return result;
}

function extractLayoutNode(
  node: PMNode,
  scope: Scope,
  groupListLayouts: Record<string, LayoutNode[]>,
) {
  if (node.type.name === "row") {
    node.forEach((child) => {
      if (child.type.name === "field") {
        extractField(child, scope);
      } else if (child.type.name === "list") {
        extractList(child, scope);
      } else if (child.type.name === "inlineList") {
        extractInlineList(child, scope);
      }
    });
    return;
  }

  if (node.type.name === "list") {
    extractList(node, scope);
    return;
  }

  if (node.type.name === "inlineList") {
    extractInlineList(node, scope);
    return;
  }

  if (node.type.name !== "groupList") {
    return;
  }

  const groupListId = node.attrs.groupListId as string;
  if (!scope.groupLists[groupListId]) {
    scope.groupLists[groupListId] = [];
  }

  node.forEach((instanceNode) => {
    if (instanceNode.type.name !== "groupListInstance") {
      return;
    }

    const instance: GroupListInstance = {
      _key: instanceNode.attrs.instanceKey as string,
      fields: {},
      lists: {},
      inlineLists: {},
      groupLists: {},
    };
    const hiddenIds = readHiddenIds(instanceNode.attrs._hidden);
    if (hiddenIds) {
      instance._hidden = hiddenIds;
    }

    instanceNode.forEach((innerNode) => {
      extractLayoutNode(innerNode, instance, groupListLayouts);
    });
    const layout = groupListLayouts[groupListId];
    if (layout) {
      enforceHidden(instance, layout);
    }

    scope.groupLists[groupListId].push(instance);
  });
}

function readHiddenIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const hidden = raw.filter((id): id is string => typeof id === "string");
  return hidden.length > 0 ? hidden : undefined;
}

function extractField(node: PMNode, scope: Scope) {
  const { fieldId } = node.attrs;
  if (!fieldId) {
    if (typeof window !== "undefined" && !hasWarnedAboutMalformedField) {
      hasWarnedAboutMalformedField = true;
      console.warn("Skipping malformed field node without fieldId", node.toJSON());
    }
    return;
  }

  let html = "";
  node.forEach((child) => {
    if (child.type.name === "paragraph") {
      html = paragraphToHTML(child);
    }
  });

  scope.fields[fieldId as string] = html;
}

function extractList(node: PMNode, scope: Scope) {
  const listId = node.attrs.listId as string | undefined;
  if (!listId) return;

  const defaultItemStyle = normalizeListItemStyle(
    node.attrs.defaultItemStyle,
    "plain",
  );

  const items: ListItem[] = [];
  node.forEach((listItem) => {
    if (listItem.type.name !== "listItem") return;

    let html = "";
    listItem.forEach((para) => {
      if (para.type.name === "paragraph") {
        html = paragraphToHTML(para);
      }
    });

    items.push({
      style: normalizeListItemStyle(listItem.attrs.style, defaultItemStyle),
      text: html,
    });
  });

  scope.lists[listId] = items;
}

function extractInlineList(node: PMNode, scope: Scope) {
  const listId = node.attrs.listId as string | undefined;
  if (!listId) return;

  const items: string[] = [];
  node.forEach((inlineListItem) => {
    if (inlineListItem.type.name !== "inlineListItem") return;

    let html = "";
    inlineListItem.forEach((para) => {
      if (para.type.name === "paragraph") {
        html = paragraphToHTML(para);
      }
    });

    items.push(html);
  });

  scope.inlineLists[listId] = items;
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
 * Serialize a PM paragraph node's inline content to an HTML string.
 * Handles bold, italic, underline, and link marks.
 */
function paragraphToHTML(para: PMNode): string {
  let html = "";
  para.forEach((inline) => {
    if (inline.isText) {
      let text = escapeHTML(inline.text ?? "");
      const marks = [...inline.marks].sort((a, b) => {
        const order: Record<string, number> = {
          link: 0,
          bold: 1,
          italic: 2,
          underline: 3,
        };
        return (order[a.type.name] ?? 3) - (order[b.type.name] ?? 3);
      });
      for (const mark of marks) {
        if (mark.type.name === "bold") text = `<b>${text}</b>`;
        else if (mark.type.name === "italic") text = `<i>${text}</i>`;
        else if (mark.type.name === "underline") text = `<u>${text}</u>`;
        else if (mark.type.name === "link") {
          text = `<a href="${escapeAttr(mark.attrs.href as string)}">${text}</a>`;
        }
      }
      html += text;
    }
  });
  return html;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
