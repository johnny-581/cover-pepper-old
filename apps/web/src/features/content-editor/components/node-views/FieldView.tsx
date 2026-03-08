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

const bgClasses: Record<string, string> = {
  none: "",
  grey: "bg-muted",
  yellow: "bg-cream dark:bg-cream-dim",
};

export function FieldView({ node }: NodeViewProps) {
  const { font, background, sizing, bold, italic, underline, placeholder } =
    node.attrs;

  // Field always has exactly one paragraph child
  const isEmpty =
    node.content.childCount === 1 &&
    node.content.firstChild?.type.name === "paragraph" &&
    node.content.firstChild?.content.size === 0;

  return (
    <NodeViewWrapper
      className={cn(
        "field relative min-w-0 rounded px-1.5",
        fontClasses[font as string] ?? "",
        bgClasses[background as string] ?? "",
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
        // "bg-amber-700",
      )}
    >
      {/* Invisible placeholder text to reserve width for hug-sized fields */}
      {isEmpty && sizing === "hug" && (
        <span className="invisible whitespace-nowrap h-0 block overflow-hidden">
          {placeholder as string}
        </span>
      )}
      <div
        className="relative"
        data-placeholder={isEmpty ? (placeholder as string) : undefined}
      >
        <NodeViewContent
          className={cn(
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[1.2em]",
            "[&_.ProseMirror_p]:m-0",
          )}
        />
      </div>
    </NodeViewWrapper>
  );
}
