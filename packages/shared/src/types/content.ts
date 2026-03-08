export type FileContent = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};

export type GroupListInstance = {
  _key: string;
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};
