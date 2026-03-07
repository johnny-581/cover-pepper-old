import { Node, mergeAttributes } from "@tiptap/core";

export const ContentListNode = Node.create({
  name: "contentList",
  content: "contentListItem+",

  parseHTML() {
    return [{ tag: 'div[data-type="content-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "content-list" }),
      0,
    ];
  },
});
