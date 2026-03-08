import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DecoratorView } from "../components/node-views/DecoratorView";

export const DecoratorNode = Node.create({
  name: "decorator",
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      text: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="decorator"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "decorator" }),
      node.attrs.text,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DecoratorView, {
      as: "span",
      className: "shrink-0",
    });
  },
});
