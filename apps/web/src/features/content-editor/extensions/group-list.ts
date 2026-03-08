import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GroupListView } from "../components/node-views/GroupListView";

export const GroupListNode = Node.create({
  name: "groupList",
  group: "layoutNode",
  content: "groupListInstance+",

  addAttributes() {
    return {
      groupListId: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-list" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroupListView);
  },
});
