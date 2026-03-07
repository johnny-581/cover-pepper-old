import { Node, mergeAttributes } from "@tiptap/core";

export const FieldRowNode = Node.create({
  name: "fieldRow",
  group: "layoutRow",
  content: "(fieldBlock | decoratorBlock)+",

  parseHTML() {
    return [{ tag: 'div[data-type="field-row"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "field-row" }),
      0,
    ];
  },
});
