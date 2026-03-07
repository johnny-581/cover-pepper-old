import { useEditor, EditorContent } from "@tiptap/react";
import { useEditorStore } from "./store";
import { createDocumentExtensions } from "./extensions";
import { buildDocument } from "./utils/build-document";
import { extractContent } from "./utils/extract-content";
import { buildGroupLayoutMap } from "./utils/schema-helpers";

export function ContentEditor() {
  const schema = useEditorStore((s) => s.schema);
  const initialContent = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);

  const editor = useEditor({
    extensions: createDocumentExtensions(),
    content: buildDocument(schema, initialContent),
    onCreate: ({ editor }) => {
      (editor.storage as unknown as Record<string, unknown>).documentMeta = {
        templateSchema: schema,
        groupLayouts: buildGroupLayoutMap(schema.layout),
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
