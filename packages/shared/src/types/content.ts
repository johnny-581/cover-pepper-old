export type ListItemStyle = "plain" | "bullet" | "numbered";

export type ListItem = {
  style: ListItemStyle;
  text: string;
};

export type FileContent = {
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};

export type GroupListInstance = {
  _key: string;
  _hidden?: string[];
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};
