import { Node, mergeAttributes } from "@tiptap/core";

export const RowNode = Node.create({
  name: "row",
  group: "layoutNode",
  content: "(field | decorator | list | inlineList)*",

  parseHTML() {
    return [{ tag: 'div[data-type="row"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "row" }), 0];
  },
});
