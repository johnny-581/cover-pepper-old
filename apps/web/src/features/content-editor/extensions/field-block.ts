import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FieldBlockView } from "../components/node-views/FieldBlockView";

export const FieldBlockNode = Node.create({
  name: "fieldBlock",
  content: "paragraph | contentList",
  isolating: true,

  addAttributes() {
    return {
      fieldId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans-sm" },
      background: { default: "none" },
      display: { default: "normal" },
      bold: { default: false },
      italic: { default: false },
      underline: { default: false },
      placeholder: { default: "" },
      isList: { default: false },
      listId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="field-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "field-block" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldBlockView, {
      as: "div",
      className: "field-block",
    });
  },
});
