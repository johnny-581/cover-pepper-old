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
  grey: "bg-muted rounded px-1.5",
  yellow: "bg-cream dark:bg-cream-dim rounded px-1.5",
};

export function FieldBlockView({ node }: NodeViewProps) {
  const {
    font,
    background,
    sizing,
    bold,
    italic,
    underline,
    placeholder,
    isList,
    display,
  } = node.attrs;

  // Check if content is empty (for placeholder display)
  const isEmpty =
    !isList &&
    node.content.childCount === 1 &&
    node.content.firstChild?.type.name === "paragraph" &&
    node.content.firstChild?.content.size === 0;

  // For list fields, check if there's a single empty item
  const isListEmpty =
    isList &&
    node.content.childCount === 1 &&
    node.content.firstChild?.type.name === "contentList" &&
    node.content.firstChild?.childCount === 1 &&
    node.content.firstChild?.firstChild?.type.name === "contentListItem" &&
    node.content.firstChild?.firstChild?.content.childCount === 1 &&
    node.content.firstChild?.firstChild?.content.firstChild?.content.size === 0;

  const showPlaceholder = isEmpty || isListEmpty;

  return (
    <NodeViewWrapper
      className={cn(
        "field-block relative min-w-0",
        fontClasses[font as string] ?? "",
        bgClasses[background as string] ?? "",
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
        sizing === "fill" && "flex-[1_1_0%] min-w-0",
        sizing === "hug" && "shrink-0",
      )}
      data-display={display}
      data-is-list={isList ? "true" : undefined}
    >
      {/* Invisible placeholder text to reserve width for hug-sized fields */}
      {showPlaceholder && sizing === "hug" && (
        <span className="invisible whitespace-nowrap h-0 block overflow-hidden">
          {placeholder as string}
        </span>
      )}
      <div className="relative">
        <NodeViewContent
          className={cn(
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[1.2em]",
            "[&_.ProseMirror_p]:m-0",
          )}
        />
        {showPlaceholder && (
          <span className="pointer-events-none absolute inset-0 flex items-center text-muted-foreground/50 whitespace-nowrap">
            {placeholder as string}
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}
