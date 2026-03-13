import type { ListItemStyle } from "./content";

export type FieldDef = { id: string };
export type ListDef = { id: string };
export type InlineListDef = { id: string };
export type GroupListDef = {
  id: string;
  fields: FieldDef[];
  lists: ListDef[];
  inlineLists: InlineListDef[];
  groupLists: GroupListDef[];
};

export type TemplateSpec = {
  fields: FieldDef[];
  lists: ListDef[];
  inlineLists: InlineListDef[];
  groupLists: GroupListDef[];
};

export type TemplateLayout = LayoutNode[];

export type LayoutNode = Row | List | InlineList | GroupList;

export type Row = { type: "row"; blocks: RowBlock[] };

export type GroupList = {
  type: "groupList";
  groupListId: string;
  layout: LayoutNode[];
};

export type RowBlock = Field | Decorator | List | InlineList | BlockGroup;

export type FontFamily = "sans" | "serif";
export type FontSize = "small" | "normal" | "heading";
export type Background = "none" | "grey" | "yellow";
export type DefaultFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  hideable?: boolean;
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  defaultFormat?: DefaultFormat;
};

export type Decorator = { type: "decorator"; text: string };

export type BlockGroup = {
  type: "group";
  sizing: "fill" | "hug";
  blocks: (Field | Decorator | InlineList)[];
};

export type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  hideable?: boolean;
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  defaultFormat?: DefaultFormat;
  defaultItemStyle?: ListItemStyle;
};

export type InlineList = {
  type: "inlinelist";
  listId: string;
  sizing: "fill" | "hug";
  hideable?: boolean;
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  defaultFormat?: DefaultFormat;
};
