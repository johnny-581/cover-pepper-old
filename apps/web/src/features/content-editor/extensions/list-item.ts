import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { splitListItem } from "@tiptap/pm/schema-list";
import { Selection } from "@tiptap/pm/state";
import { ListItemView } from "../components/node-views/ListItemView";

type ListItemContext = {
  listItemDepth: number;
  listDepth: number;
};

function getListItemContext(selectionFrom: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}): ListItemContext | null {
  for (let depth = selectionFrom.depth; depth > 0; depth--) {
    if (selectionFrom.node(depth).type.name === "listItem") {
      const listDepth = depth - 1;
      if (listDepth < 0 || selectionFrom.node(listDepth).type.name !== "list") {
        return null;
      }
      return { listItemDepth: depth, listDepth };
    }
  }
  return null;
}

function isListItemEmpty(listItemNode: { textContent: string }): boolean {
  return listItemNode.textContent.trim().length === 0;
}

export const ListItemNode = Node.create({
  name: "listItem",
  content: "paragraph",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="list-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "list-item" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ListItemView, {
      as: "div",
    });
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const listItemType = editor.state.schema.nodes.listItem;
        if (!listItemType) return false;

        return splitListItem(listItemType)(
          editor.state,
          editor.view.dispatch,
          editor.view,
        );
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;
        const context = getListItemContext($from);
        if (!context) return false;

        const { listItemDepth, listDepth } = context;
        const listNode = $from.node(listDepth);
        const listItemNode = $from.node(listItemDepth);
        const listItemIndex = $from.index(listDepth);

        if (!isListItemEmpty(listItemNode)) return false;
        if (listNode.childCount <= 1) {
          // Keep one editable item in every list.
          return true;
        }

        const listItemPos = $from.before(listItemDepth);
        const deleteFrom = listItemPos;
        const deleteTo = listItemPos + listItemNode.nodeSize;
        const hasPreviousSibling = listItemIndex > 0;

        const tr = state.tr.delete(deleteFrom, deleteTo);
        if (hasPreviousSibling) {
          const previousNode = listNode.child(listItemIndex - 1);
          const previousNodePos = listItemPos - previousNode.nodeSize;
          const previousNodeEnd = previousNodePos + previousNode.nodeSize - 1;
          const selectionPos = Math.max(
            0,
            Math.min(previousNodeEnd, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), -1));
        } else {
          const selectionPos = Math.max(
            0,
            Math.min(listItemPos + 1, tr.doc.content.size),
          );
          tr.setSelection(Selection.near(tr.doc.resolve(selectionPos), 1));
        }

        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});
