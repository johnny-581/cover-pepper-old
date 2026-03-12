import { useEditor, EditorContent } from "@tiptap/react";
import type { LayoutNode } from "@pepper-apply/shared";
import { useEditorStore } from "./store";
import { createDocumentExtensions } from "./extensions";
import { buildDocument } from "./utils/document/build-document";
import { extractContent } from "./utils/document/extract-content";
import { buildGroupListLayoutMap } from "./utils/schema/schema-helpers";

function readGroupListLayouts(editor: {
  storage: unknown;
}): Record<string, LayoutNode[]> | null {
  const storage = editor.storage as Record<string, unknown>;
  const meta = storage.documentMeta as { groupListLayouts?: unknown } | undefined;
  if (!meta || typeof meta !== "object") return null;
  if (!meta.groupListLayouts || typeof meta.groupListLayouts !== "object") return null;
  return meta.groupListLayouts as Record<string, LayoutNode[]>;
}

export function ContentEditor() {
  const templateSpec = useEditorStore((s) => s.templateSpec);
  const templateLayout = useEditorStore((s) => s.templateLayout);
  const initialContent = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);

  const editor = useEditor({
    extensions: createDocumentExtensions(),
    content: buildDocument(templateSpec, templateLayout, initialContent),
    onCreate: ({ editor }) => {
      (editor.storage as unknown as Record<string, unknown>).documentMeta = {
        templateSpec,
        templateLayout,
        groupListLayouts: buildGroupListLayoutMap(templateLayout),
      };
    },
    onUpdate: ({ editor }) => {
      const groupListLayouts =
        readGroupListLayouts(editor) ?? buildGroupListLayoutMap(templateLayout);
      const newContent = extractContent(editor.state.doc, groupListLayouts);
      setContent(newContent);
    },
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <EditorContent
      editor={editor}
      className="flex flex-col gap-0.5"
    />
  );
}
