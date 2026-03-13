import { Node, mergeAttributes } from "@tiptap/core";

export const BlockGroupNode = Node.create({
  name: "blockGroup",
  content: "(field | decorator | inlineList)+",

  addAttributes() {
    return {
      sizing: {
        default: "hug",
        parseHTML: (element) =>
          element.getAttribute("data-sizing")
          ?? element.getAttribute("sizing")
          ?? "hug",
        renderHTML: (attributes) => ({
          "data-sizing": String(attributes.sizing ?? "hug"),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="block-group"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "block-group" }),
      0,
    ];
  },
});
