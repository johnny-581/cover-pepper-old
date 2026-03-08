import type {
  Template,
  GroupListDef,
  LayoutNode,
} from "@pepper-apply/shared";

/**
 * Recursively search the Template for a GroupListDef by its ID.
 */
export function findGroupListDefById(
  template: Template,
  groupListId: string,
): GroupListDef | null {
  function search(groupLists: GroupListDef[]): GroupListDef | null {
    for (const g of groupLists) {
      if (g.id === groupListId) return g;
      const found = search(g.groupLists);
      if (found) return found;
    }
    return null;
  }
  return search(template.groupLists);
}

/**
 * Build a mapping from groupListId → layout nodes for that group list.
 * Recursively walks the layout tree.
 */
export function buildGroupListLayoutMap(
  layout: LayoutNode[],
  map: Record<string, LayoutNode[]> = {},
): Record<string, LayoutNode[]> {
  for (const node of layout) {
    if (node.type === "groupList") {
      map[node.groupListId] = node.layout;
      buildGroupListLayoutMap(node.layout, map);
    }
  }
  return map;
}

export function findGroupListLayout(
  layout: Template["layout"],
  groupListId: string,
): Template["layout"] | null {
  for (const node of layout) {
    if (node.type !== "groupList") continue;
    if (node.groupListId === groupListId) {
      return node.layout;
    }

    const nested = findGroupListLayout(node.layout, groupListId);
    if (nested) return nested;
  }

  return null;
}
