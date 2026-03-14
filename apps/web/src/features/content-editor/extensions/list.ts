import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ListView } from "../components/node-views/ListView";

export const ListNode = Node.create({
  name: "list",
  group: "layoutNode",
  content: "listItem+",

  addAttributes() {
    return {
      listId: { default: "" },
      sizing: { default: "fill" },
      font: { default: "sans" },
      size: { default: "normal" },
      background: { default: "none" },
      defaultItemStyle: { default: "plain" },
      hideable: { default: false },
      placeholder: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "list" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ListView, {
      as: "div",
      className: "list",
      attrs: ({ node }) => ({
        "data-sizing": String(node.attrs.sizing),
      }),
    });
  },
});
