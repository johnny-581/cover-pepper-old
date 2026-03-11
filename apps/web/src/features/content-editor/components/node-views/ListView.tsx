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

export function ListView({ node }: NodeViewProps) {
  const {
    font,
    size,
    background,
    defaultFormat,
    listKind,
    sizing,
  } = node.attrs;
  const isInline = listKind === "inlineCompat";
  const baseFormat = (defaultFormat ?? {}) as {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  return (
    <NodeViewWrapper
      className={cn(
        "relative min-w-0",
        isInline ? "flex items-stretch" : "flex flex-col",
        sizing === "fill" && "flex-1 basis-0 min-w-1",
        sizing === "hug" && "shrink-0",
        fontClasses[(font as string) ?? "sans"] ?? "",
        sizeClasses[(size as string) ?? "normal"] ?? "",
        bgClasses[(background as string) ?? "none"] ?? "",
        baseFormat.bold && "font-bold",
        baseFormat.italic && "italic",
        baseFormat.underline && "underline",
      )}
    >
      <NodeViewContent
        className={cn(isInline && "flex flex-wrap items-center gap-1")}
      />
    </NodeViewWrapper>
  );
}
