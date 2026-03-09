import { create } from "zustand";
import type { FileContent, TemplateLayout, TemplateSpec } from "@pepper-apply/shared";
import { templateContent } from "@/data/resume/template-content";
import { templateLayout } from "@/data/resume/template-layout";
import { templateSpec } from "@/data/resume/template-spec";

type EditorState = {
  templateSpec: TemplateSpec;
  templateLayout: TemplateLayout;
  content: FileContent;
  setContent: (content: FileContent) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  templateSpec,
  templateLayout,
  content: templateContent,
  setContent: (content) => set({ content }),
}));
