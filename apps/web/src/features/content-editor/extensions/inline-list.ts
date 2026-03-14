import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InlineListView } from "../components/node-views/InlineListView";

export const InlineListNode = Node.create({
  name: "inlineList",
  group: "layoutNode",
  content: "inlineListItem+",

  addAttributes() {
    return {
      listId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans" },
      size: { default: "normal" },
      background: { default: "none" },
      hideable: { default: false },
      placeholder: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="inline-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "inline-list" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineListView, {
      as: "div",
      className: "inline-list",
      attrs: ({ node }) => ({
        "data-sizing": String(node.attrs.sizing),
      }),
    });
  },
});
