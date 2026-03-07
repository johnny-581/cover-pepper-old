import { create } from "zustand";
import type { TemplateSchema, FileContent } from "@pepper-apply/shared";
import { resumeSchema, resumeContent } from "@/data/resume-data";

type EditorState = {
  schema: TemplateSchema;
  content: FileContent;
  setContent: (content: FileContent) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  schema: resumeSchema,
  content: resumeContent,
  setContent: (content) => set({ content }),
}));
