// ── Schema definitions (unchanged) ──

export type FieldDef = { id: string; optional?: boolean };
export type ListDef = { id: string; itemId: string };
export type GroupListDef = {
  id: string;
  fields: FieldDef[];
  lists: ListDef[];
  groupLists: GroupListDef[];
};

export type TemplateSpec = {
  fields: FieldDef[];
  lists: ListDef[];
  groupLists: GroupListDef[];
};

// ── Layout ──

export type TemplateLayout = LayoutNode[];

export type LayoutNode = Row | List | GroupList;

export type Row = { type: "row"; blocks: RowBlock[] };

export type GroupList = {
  type: "groupList";
  groupListId: string;
  layout: LayoutNode[];
};

export type RowBlock = Field | Decorator | List;

export type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  style: FieldStyle;
  outputStyle: OutputStyle;
};

export type Decorator = { type: "decorator"; text: string };

/**
 * Single type for both inline (in-row) and standalone lists.
 * Rendering direction is determined by context:
 * - Inside a Row → horizontal, each item hugs content
 * - Standalone (top-level / in groupList layout) → vertical
 */
export type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  display: "plain" | "bulleted";
  itemStyle: ItemStyle;
};

export type ItemStyle = {
  font: FontToken;
  outputStyle: OutputStyle;
};

export type FieldStyle = {
  font: FontToken;
  background: BackgroundToken;
};

export type FontToken =
  | "sans-lg"
  | "sans-md"
  | "sans-sm"
  | "serif-lg"
  | "serif-md"
  | "serif-sm";

export type BackgroundToken = "none" | "grey" | "yellow";

export type OutputStyle = { bold: boolean; italic: boolean; underline: boolean };
