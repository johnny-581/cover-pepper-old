import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

const fontClasses: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
};

const sizeClasses: Record<string, string> = {
  small: "text-sm",
  normal: "text-base",
  heading: "text-2xl",
};

const bgClasses: Record<string, string> = {
  none: "",
  grey: "bg-muted",
  yellow: "bg-cream dark:bg-cream-dim",
};

export function FieldView({ node }: NodeViewProps) {
  const { font, size, background, sizing, defaultFormat, placeholder } =
    node.attrs;
  const baseFormat = (defaultFormat ?? {}) as {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  // Field always has exactly one paragraph child
  const isEmpty =
    node.content.childCount === 1 &&
    node.content.firstChild?.type.name === "paragraph" &&
    node.content.firstChild?.content.size === 0;

  return (
    <NodeViewWrapper
      className={cn(
        "field relative min-w-0 rounded px-1.5",
        fontClasses[(font as string) ?? "sans"] ?? "",
        sizeClasses[(size as string) ?? "normal"] ?? "",
        bgClasses[background as string] ?? "",
        baseFormat.bold && "font-bold",
        baseFormat.italic && "italic",
        baseFormat.underline && "underline",
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
