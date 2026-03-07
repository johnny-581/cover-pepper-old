import { ContentEditor } from "./ContentEditor";
import { JsonPanel } from "./components/JsonPanel";

export function EditorPage() {
  return (
    <div className="flex h-screen">
      <div className="flex-[3] overflow-auto bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-8 bg-white dark:bg-zinc-900 shadow-sm my-8 px-10 py-8 min-h-[calc(100vh-4rem)] rounded-2xl">
          <ContentEditor />
        </div>
      </div>
      <div className="flex-[2] min-w-0">
        <JsonPanel />
      </div>
    </div>
  );
}
