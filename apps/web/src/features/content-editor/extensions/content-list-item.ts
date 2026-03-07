import { Node, mergeAttributes } from "@tiptap/core";

export const ContentListItemNode = Node.create({
  name: "contentListItem",
  content: "paragraph",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="content-list-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "content-list-item" }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;

        // Find the contentListItem ancestor
        let listItemDepth: number | null = null;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "contentListItem") {
            listItemDepth = d;
            break;
          }
        }
        if (listItemDepth === null) return false;

        // Check if cursor is at the very start of the list item
        const listItemStart = $from.start(listItemDepth);
        if ($from.pos !== listItemStart) return false;

        // Check if this is the only item in the contentList
        const contentListDepth = listItemDepth - 1;
        const contentListNode = $from.node(contentListDepth);
        if (contentListNode.type.name !== "contentList") return false;
        if (contentListNode.childCount <= 1) {
          // Prevent deletion of the last item
          return true;
        }

        return false; // Let default join behavior handle it
      },
    };
  },
});
