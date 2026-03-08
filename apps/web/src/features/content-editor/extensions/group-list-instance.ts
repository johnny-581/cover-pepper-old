import { Node, mergeAttributes } from "@tiptap/core";

export const GroupListInstanceNode = Node.create({
  name: "groupListInstance",
  content: "(layoutNode)+",
  isolating: true,

  addAttributes() {
    return {
      instanceKey: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-list-instance"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-list-instance" }),
      0,
    ];
  },
});
