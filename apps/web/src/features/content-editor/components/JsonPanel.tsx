import { useEditorStore } from "../store";

export function JsonPanel() {
  const content = useEditorStore((s) => s.content);

  return (
    <div className="h-screen sticky top-0 flex flex-col bg-zinc-900 dark:bg-zinc-950 text-zinc-100 border-l border-zinc-700 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 dark:border-zinc-800 flex-shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
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
