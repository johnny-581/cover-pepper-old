import { Node, mergeAttributes } from "@tiptap/core";

export const GroupInstanceNode = Node.create({
  name: "groupInstance",
  content: "(layoutRow)+",
  isolating: true,

  addAttributes() {
    return {
      instanceKey: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-instance"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-instance" }),
      0,
    ];
  },
});
