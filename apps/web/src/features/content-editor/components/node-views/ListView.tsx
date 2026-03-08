import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

const fontClasses: Record<string, string> = {
  "sans-lg": "font-sans text-2xl",
  "sans-md": "font-sans text-lg",
  "sans-sm": "font-sans text-sm",
  "serif-lg": "font-serif text-2xl",
  "serif-md": "font-serif text-lg",
  "serif-sm": "font-serif text-sm",
};

export function ListView({ node }: NodeViewProps) {
  const { font, bold, italic, underline, inline, sizing } = node.attrs;
  const isInline = inline === true;

  return (
    <NodeViewWrapper
      className={cn(
        "relative min-w-0",
        isInline ? "flex items-stretch" : "flex flex-col",
        sizing === "fill" && "flex-1 basis-0 min-w-1",
        sizing === "hug" && "shrink-0",
        fontClasses[font as string] ?? "",
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
      )}
    >
      <NodeViewContent
        className={cn(isInline && "flex flex-wrap items-center gap-1")}
      />
    </NodeViewWrapper>
  );
}
