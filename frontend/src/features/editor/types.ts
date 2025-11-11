import type { Letter } from "@/features/letters/types";

export type MonacoEditorProps = {
    letter: Letter;
    /** Pass the outer scroll container (the overflow-auto div). */
    scrollContainerRef?: React.RefObject<HTMLElement | null>;
};