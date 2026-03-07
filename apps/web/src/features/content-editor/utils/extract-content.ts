import type { Node as PMNode } from "@tiptap/pm/model";
import type { FileContent, GroupInstance } from "@pepper-apply/shared";

type Scope = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, GroupInstance[]>;
};

export function extractContent(doc: PMNode): FileContent {
  const result: FileContent = { fields: {}, lists: {}, groups: {} };
  doc.forEach((topNode) => {
    extractLayoutRow(topNode, result);
  });
  return result;
}

function extractLayoutRow(node: PMNode, scope: Scope) {
  if (node.type.name === "fieldRow") {
    node.forEach((child) => {
      if (child.type.name === "fieldBlock") {
        extractFieldBlock(child, scope);
      }
    });
  } else if (node.type.name === "groupSection") {
    const groupId = node.attrs.groupId as string;
    if (!scope.groups[groupId]) {
      scope.groups[groupId] = [];
    }
    node.forEach((instanceNode) => {
      if (instanceNode.type.name === "groupInstance") {
        const instance: GroupInstance = {
          _key: instanceNode.attrs.instanceKey as string,
          fields: {},
          lists: {},
          groups: {},
        };
        instanceNode.forEach((innerRow) => {
          extractLayoutRow(innerRow, instance);
        });
        scope.groups[groupId].push(instance);
      }
    });
  }
}

function extractFieldBlock(node: PMNode, scope: Scope) {
  const { fieldId, isList, listId } = node.attrs;

  if (isList && listId) {
    const items: string[] = [];
    node.forEach((child) => {
      if (child.type.name === "contentList") {
        child.forEach((listItem) => {
          if (listItem.type.name === "contentListItem") {
            listItem.forEach((para) => {
              items.push(paragraphToHTML(para));
            });
          }
        });
      }
    });
    scope.lists[listId as string] = items;
  } else {
    let html = "";
    node.forEach((child) => {
      if (child.type.name === "paragraph") {
        html = paragraphToHTML(child);
      }
    });
    scope.fields[fieldId as string] = html;
  }
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
