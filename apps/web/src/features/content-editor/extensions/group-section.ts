import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GroupSectionView } from "../components/node-views/GroupSectionView";

export const GroupSectionNode = Node.create({
  name: "groupSection",
  group: "layoutRow",
  content: "groupInstance+",

  addAttributes() {
    return {
      groupId: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "group-section" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroupSectionView);
  },
});
