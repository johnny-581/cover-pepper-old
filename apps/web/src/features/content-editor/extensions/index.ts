import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { FieldRowNode } from "./field-row";
import { FieldBlockNode } from "./field-block";
import { DecoratorBlockNode } from "./decorator-block";
import { GroupSectionNode } from "./group-section";
import { GroupInstanceNode } from "./group-instance";
import { ContentListNode } from "./content-list";
import { ContentListItemNode } from "./content-list-item";

const CustomDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(layoutRow)+",
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
    FieldRowNode,
    FieldBlockNode,
    DecoratorBlockNode,
    GroupSectionNode,
    GroupInstanceNode,
    ContentListNode,
    ContentListItemNode,
  ];
}
