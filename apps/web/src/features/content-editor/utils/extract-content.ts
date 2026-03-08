import type { Node as PMNode } from "@tiptap/pm/model";
import type { FileContent, GroupListInstance } from "@pepper-apply/shared";

type Scope = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};

let hasWarnedAboutMalformedField = false;

export function extractContent(doc: PMNode): FileContent {
  const result: FileContent = { fields: {}, lists: {}, groupLists: {} };
  doc.forEach((topNode) => {
    extractLayoutNode(topNode, result);
  });
  return result;
}

function extractLayoutNode(node: PMNode, scope: Scope) {
  if (node.type.name === "row") {
    node.forEach((child) => {
      if (child.type.name === "field") {
        extractField(child, scope);
      } else if (child.type.name === "list") {
        extractList(child, scope);
      }
    });
  } else if (node.type.name === "list") {
    extractList(node, scope);
  } else if (node.type.name === "groupList") {
    const groupListId = node.attrs.groupListId as string;
    if (!scope.groupLists[groupListId]) {
      scope.groupLists[groupListId] = [];
    }
    node.forEach((instanceNode) => {
      if (instanceNode.type.name === "groupListInstance") {
        const instance: GroupListInstance = {
          _key: instanceNode.attrs.instanceKey as string,
          fields: {},
          lists: {},
          groupLists: {},
        };
        instanceNode.forEach((innerNode) => {
          extractLayoutNode(innerNode, instance);
        });
        scope.groupLists[groupListId].push(instance);
      }
    });
  }
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
  const { listId } = node.attrs;
  const items: string[] = [];
  node.forEach((listItem) => {
    if (listItem.type.name === "listItem") {
      listItem.forEach((para) => {
        items.push(paragraphToHTML(para));
      });
    }
  });
  scope.lists[listId as string] = items;
}

/**
 * Serialize a PM paragraph node's inline content to an HTML string.
 * Handles bold, italic, and link marks.
 */
function paragraphToHTML(para: PMNode): string {
  let html = "";
  para.forEach((inline) => {
    if (inline.isText) {
      let text = escapeHTML(inline.text ?? "");
      // Sort marks to ensure consistent nesting (link outermost, then bold, then italic)
      const marks = [...inline.marks].sort((a, b) => {
        const order: Record<string, number> = { link: 0, bold: 1, italic: 2 };
        return (order[a.type.name] ?? 3) - (order[b.type.name] ?? 3);
      });
      for (const mark of marks) {
        if (mark.type.name === "bold") text = `<b>${text}</b>`;
        else if (mark.type.name === "italic") text = `<i>${text}</i>`;
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
