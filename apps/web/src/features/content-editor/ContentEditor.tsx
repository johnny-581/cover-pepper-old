import { useEditor, EditorContent } from "@tiptap/react";
import { useEditorStore } from "./store";
import { createDocumentExtensions } from "./extensions";
import { buildDocument } from "./utils/build-document";
import { extractContent } from "./utils/extract-content";
import { buildGroupListLayoutMap } from "./utils/schema-helpers";

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
      const newContent = extractContent(editor.state.doc);
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
