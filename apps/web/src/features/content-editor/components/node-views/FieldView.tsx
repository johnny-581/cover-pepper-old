import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { NODE_PADDING, nodeAttrClasses } from "./node-view-utils";

export function FieldView({ node }: NodeViewProps) {
  const { font, size, background, sizing, defaultFormat, placeholder } =
    node.attrs;

  // Field always has exactly one paragraph child
  const isEmpty =
    node.content.childCount === 1 &&
    node.content.firstChild?.type.name === "paragraph" &&
    node.content.firstChild?.content.size === 0;

  return (
    <NodeViewWrapper
      className={cn(
        NODE_PADDING,
        "relative min-w-0 rounded",
        sizing === "fill" && "flex-1",
        sizing === "hug" && "shrink-0",
        ...nodeAttrClasses({ font, size, background, defaultFormat }),
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
