export type FileContent = {
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, GroupInstance[]>;
};

export type GroupInstance = {
  _key: string;
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, GroupInstance[]>;
};
