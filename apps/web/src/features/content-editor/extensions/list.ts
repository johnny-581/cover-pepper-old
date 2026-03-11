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
      listKind: { default: "block" },
      sizing: { default: "fill" },
      font: { default: "sans" },
      size: { default: "normal" },
      background: { default: "none" },
      defaultFormat: { default: {} },
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
        "data-list-kind": String(node.attrs.listKind),
        "data-sizing": String(node.attrs.sizing),
      }),
    });
  },
});
