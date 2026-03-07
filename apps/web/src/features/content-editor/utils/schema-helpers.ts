import type {
  TemplateSchema,
  GroupDef,
  LayoutRow,
} from "@pepper-apply/shared";

/**
 * Recursively search the TemplateSchema for a GroupDef by its ID.
 */
export function findGroupDefById(
  schema: TemplateSchema,
  groupId: string,
): GroupDef | null {
  function search(groups: GroupDef[]): GroupDef | null {
    for (const g of groups) {
      if (g.id === groupId) return g;
      const found = search(g.groups);
      if (found) return found;
    }
    return null;
  }
  return search(schema.groups);
}

/**
 * Build a mapping from groupId → layout rows for that group.
 * Recursively walks the layout tree.
 */
export function buildGroupLayoutMap(
  layout: LayoutRow[],
  map: Record<string, LayoutRow[]> = {},
): Record<string, LayoutRow[]> {
  for (const row of layout) {
    if (row.type === "groupSection") {
      map[row.groupId] = row.layout;
      buildGroupLayoutMap(row.layout, map);
    }
  }
  return map;
}
