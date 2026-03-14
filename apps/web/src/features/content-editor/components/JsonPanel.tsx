import { useEditorStore } from "../store";

export function JsonPanel() {
  const content = useEditorStore((s) => s.content);

  return (
    <div className="sticky top-0 flex h-screen flex-col border-l border-border bg-muted/30 text-foreground">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          FileContent
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}
