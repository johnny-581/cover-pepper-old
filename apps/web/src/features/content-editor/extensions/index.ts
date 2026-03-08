import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { RowNode } from "./row";
import { FieldNode } from "./field";
import { DecoratorNode } from "./decorator";
import { GroupListNode } from "./group-list";
import { GroupListInstanceNode } from "./group-list-instance";
import { ListNode } from "./list";
import { ListItemNode } from "./list-item";
import { StructuredSelectionReset } from "./structured-selection-reset";
import { CaretJumpUndo } from "./caret-jump-undo";

const CustomDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(layoutNode)+",
});

export function createDocumentExtensions() {
  return [
    StarterKit.configure({
      document: false,
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
      horizontalRule: false,
      hardBreak: false,
      strike: false,
      code: false,
    }),
    CustomDocument,
    Link.configure({ openOnClick: false }),
    RowNode,
    FieldNode,
    DecoratorNode,
    GroupListNode,
    GroupListInstanceNode,
    ListNode,
    ListItemNode,
    CaretJumpUndo,
    StructuredSelectionReset,
  ];
}
