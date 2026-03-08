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
      inline: { default: false },
      sizing: { default: "fill" },
      display: { default: "plain" },
      placeholder: { default: "" },
      font: { default: "sans-sm" },
      bold: { default: false },
      italic: { default: false },
      underline: { default: false },
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
        "data-inline": String(node.attrs.inline),
        "data-sizing": String(node.attrs.sizing),
        "data-display": String(node.attrs.display),
      }),
    });
  },
});
