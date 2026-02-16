import type { Letter } from "@/features/letters/types";
import type { SaveStatus } from "@/features/editor/hooks/useAutosave";

export type MonacoEditorProps = {
  letter: Letter;
  /** Pass the outer scroll container (the overflow-auto div). */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Callback to report save status changes */
  onSaveStatusChange?: (status: SaveStatus) => void;
  /** When true, show only the preamble view instead of the document body */
  editingPreamble?: boolean;
};
