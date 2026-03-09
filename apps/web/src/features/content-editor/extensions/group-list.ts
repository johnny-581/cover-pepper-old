import { Node, mergeAttributes } from "@tiptap/core";

export const GroupListNode = Node.create({
  name: "groupList",
  group: "layoutNode",
  content: "groupListInstance+",

  addAttributes() {
    return {
      groupListId: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-list" }),
      0,
    ];
  },
});
