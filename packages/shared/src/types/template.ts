export type FieldDef = { id: string; optional?: boolean };
export type ListDef = { id: string; itemId: string };
export type GroupDef = {
  id: string;
  fields: FieldDef[];
  lists: ListDef[];
  groups: GroupDef[];
};

export type TemplateSchema = {
  fields: FieldDef[];
  lists: ListDef[];
  groups: GroupDef[];
  layout: LayoutRow[];
};

export type LayoutRow = FieldRow | GroupSection;
export type FieldRow = { type: "fieldRow"; blocks: LayoutBlock[] };
export type GroupSection = {
  type: "groupSection";
  groupId: string;
  layout: LayoutRow[];
};

export type LayoutBlock = FieldBlock | DecoratorBlock;
export type DecoratorBlock = { type: "decorator"; text: string };

export type FieldBlock = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  style: BlockStyle;
  outputStyle: OutputStyle;
};

export type BlockStyle = {
  font:
    | "sans-lg"
    | "sans-md"
    | "sans-sm"
    | "serif-lg"
    | "serif-md"
    | "serif-sm";
  background: "none" | "grey" | "yellow";
  display: "normal" | "bulleted";
};

export type OutputStyle = { bold: boolean; italic: boolean; underline: boolean };
