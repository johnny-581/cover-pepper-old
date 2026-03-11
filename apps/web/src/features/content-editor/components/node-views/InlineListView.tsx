import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
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

export function InlineListView({ node }: NodeViewProps) {
  const { font, size, background, defaultFormat, sizing } = node.attrs;
  const baseFormat = (defaultFormat ?? {}) as {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  return (
    <NodeViewWrapper
      className={cn(
        "inline-list relative min-w-0 flex items-stretch",
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
      <NodeViewContent className="flex flex-wrap items-center gap-1.5 w-full" />
    </NodeViewWrapper>
  );
}
