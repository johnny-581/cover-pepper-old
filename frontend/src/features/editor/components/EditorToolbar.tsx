import { useState, useEffect, useRef } from "react";
import {
  useUpdateMutation,
  useCompileMutation,
} from "@/features/letters/hooks";
import { type Letter } from "@/features/letters/types";
import Button from "@/components/Button";
import { useHotkeys } from "react-hotkeys-hook";
import { CircleCheck } from "lucide-react";

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

export default function LetterToolbar({ letter }: { letter: Letter }) {
  const [title, setTitle] = useState(letter.title);
  const update = useUpdateMutation(letter.id);
  const compile = useCompileMutation();
  const savingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setTitle(letter.title);
  }, [letter.id, letter.title]);

  useEffect(() => {
    if (title === letter.title) return;
    // setSaving("saving");
    if (savingRef.current) clearTimeout(savingRef.current);
    savingRef.current = setTimeout(async () => {
      await update.mutateAsync({ title });
      // setSaving("saved");
      // setTimeout(() => setSaving("idle"), 800);
    }, 500);
  }, [title]);

  useHotkeys("ctrl+enter", () => handleCompile(), []);

  const handleCompile = async () => {
    if (savingRef.current) {
      clearTimeout(savingRef.current);
      await update.mutateAsync({ title });
      // setSaving("saved");
      // setTimeout(() => setSaving("idle"), 800);
    }
    const blob = await compile.mutateAsync(letter.id);
    downloadBlob(blob, letter.title);
  };

  return (
    <div className="flex items-center justify-between px-5">
      <input
        className="flex-1 pr-5 theme-h1 outline-none bg-transparent"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex items-center gap-4 py-5">
        {/* <div className="fontsans">
                    {saving === "saving" && "Saving…"}
                    {saving === "saved" && "Saved"}
                </div> */}
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
