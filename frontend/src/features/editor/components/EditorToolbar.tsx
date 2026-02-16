import { useState, useEffect, useRef, useCallback } from "react";
import {
  useUpdateMutation,
  useCompileMutation,
} from "@/features/letters/hooks";
import { type Letter } from "@/features/letters/types";
import Button from "@/components/Button";
import { useHotkeys } from "react-hotkeys-hook";
import { CircleCheck } from "lucide-react";
import type { SaveStatus } from "@/features/editor/hooks/useAutosave";

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LetterToolbar({
  letter,
  saveStatus = "idle",
  editingPreamble = false,
  onTogglePreamble,
}: {
  letter: Letter;
  saveStatus?: SaveStatus;
  editingPreamble?: boolean;
  onTogglePreamble?: () => void;
}) {
  const [title, setTitle] = useState(letter.title);
  const update = useUpdateMutation(letter.id);
  const compile = useCompileMutation();
  const savingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const updateRef = useRef(update);

  // Keep refs in sync so the debounce closure always uses the latest values
  titleRef.current = title;
  updateRef.current = update;

  // Only reset local title when switching to a different letter (by id).
  // Do NOT depend on letter.title — server-returned title updates after our
  // own save should not overwrite in-progress edits.
  useEffect(() => {
    setTitle(letter.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id]);

  // Clean up pending timer on unmount or letter switch
  useEffect(() => {
    return () => {
      if (savingRef.current) clearTimeout(savingRef.current);
    };
  }, [letter.id]);

  const debouncedSaveTitle = useCallback(
    (newTitle: string) => {
      if (newTitle === letter.title) return;
      if (savingRef.current) clearTimeout(savingRef.current);
      savingRef.current = setTimeout(async () => {
        await updateRef.current.mutateAsync({ title: titleRef.current });
      }, 500);
    },
    [letter.title]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSaveTitle(newTitle);
  };

  useHotkeys("ctrl+enter", () => handleCompile(), []);

  const handleCompile = async () => {
    if (savingRef.current) {
      clearTimeout(savingRef.current);
      savingRef.current = null;
      await update.mutateAsync({ title: titleRef.current });
    }
    const blob = await compile.mutateAsync(letter.id);
    downloadBlob(blob, titleRef.current);
  };

  return (
    <div className="flex items-center justify-between px-5">
      <input
        className="flex-1 pr-5 theme-h1 outline-none bg-transparent"
        value={title}
        onChange={handleTitleChange}
      />
      <div className="flex items-center gap-3 py-5">
        <div className="text-theme-dark-gray mr-5">
          {saveStatus === "pending" && "Saving..."}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
        </div>
        <Button
          variant={editingPreamble ? "secondary" : "ghost"}
          onClick={onTogglePreamble}
        >
          Edit Preamble
        </Button>
        <Button
          icon={
            compile.isPending ? null : (
              <CircleCheck color="var(--color-theme-black)" />
            )
          }
          onClick={handleCompile}
          disabled={compile.isPending}
        >
          {compile.isPending ? "Compiling…" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}
