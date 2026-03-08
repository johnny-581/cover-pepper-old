import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FieldView } from "../components/node-views/FieldView";

export const FieldNode = Node.create({
  name: "field",
  content: "paragraph",
  isolating: true,

  addAttributes() {
    return {
      fieldId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans-sm" },
      background: { default: "none" },
      bold: { default: false },
      italic: { default: false },
      underline: { default: false },
      placeholder: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="field"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "field" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldView, {
      as: "div",
      className: "field",
      attrs: ({ node }) => ({
        "data-sizing": String(node.attrs.sizing ?? "fill"),
      }),
    });
  },
});
