import { create } from "zustand";
import type { Template, FileContent } from "@pepper-apply/shared";
import { resumeTemplate, resumeContent } from "@/data/resume-data";

type EditorState = {
  template: Template;
  content: FileContent;
  setContent: (content: FileContent) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  template: resumeTemplate,
  content: resumeContent,
  setContent: (content) => set({ content }),
}));
