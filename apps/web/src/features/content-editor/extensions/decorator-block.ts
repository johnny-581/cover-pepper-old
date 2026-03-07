import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DecoratorBlockView } from "../components/node-views/DecoratorBlockView";

export const DecoratorBlockNode = Node.create({
  name: "decoratorBlock",
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
    return ReactNodeViewRenderer(DecoratorBlockView, {
      as: "span",
    });
  },
});
