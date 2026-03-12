import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GroupListInstanceView } from "../components/node-views/GroupListInstanceView";

export const GroupListInstanceNode = Node.create({
  name: "groupListInstance",
  content: "(layoutNode)*",
  isolating: true,

  addAttributes() {
    return {
      instanceKey: { default: "" },
      _hidden: { default: undefined, rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-list-instance"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-list-instance" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroupListInstanceView, {
      as: "div",
      attrs: {
        "data-type": "group-list-instance",
      },
    });
  },
});
