import type { Fragment, Node as PMNode } from "@tiptap/pm/model";
import type { SelectionAnchor } from "../selection/analyze-selection-helpers";
import type { JSONContent } from "./build-empty-structure";

export type RewriteResult = {
  json: JSONContent;
  changed: boolean;
  anchor: SelectionAnchor | null;
};

export function copyNodeJSON(node: PMNode): JSONContent {
  return node.toJSON() as JSONContent;
}

export function trimParagraphJSON(
  paragraphNode: PMNode,
  deleteFrom: number,
  deleteTo: number,
): JSONContent {
  const before = paragraphNode.content.cut(0, deleteFrom);
  const after = paragraphNode.content.cut(deleteTo, paragraphNode.content.size);

  return buildParagraphFromFragments(paragraphNode, before, after);
}

export function buildParagraphFromFragments(
  paragraphNode: PMNode,
  before: Fragment,
  after: Fragment,
): JSONContent {
  const content = [...fragmentToJSON(before), ...fragmentToJSON(after)];
  const json = paragraphNode.toJSON() as JSONContent;

  return content.length > 0
    ? { ...json, content }
    : { ...json, content: undefined };
}

export function fragmentToJSON(fragment: Fragment): JSONContent[] {
  const content: JSONContent[] = [];

  fragment.forEach((node) => {
    content.push(node.toJSON() as JSONContent);
  });

  return content;
}

export function hasTextContent(node: JSONContent): boolean {
  if (node.type === "text") {
    return (node.text ?? "").length > 0;
  }

  const content = node.content ?? [];
  for (const child of content) {
    if (hasTextContent(child)) {
      return true;
    }
  }

  return false;
}

export function unchanged(node: PMNode): RewriteResult {
  return { json: copyNodeJSON(node), changed: false, anchor: null };
}

export function nodeWithContent(node: PMNode, content: JSONContent[]): JSONContent {
  return {
    ...copyNodeJSON(node),
    content,
  };
}
