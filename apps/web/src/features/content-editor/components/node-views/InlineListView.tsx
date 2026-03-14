import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { nodeAttrClasses } from "./node-view-utils";

export function InlineListView({ node }: NodeViewProps) {
  const { font, size, background, sizing } = node.attrs;

  return (
    <NodeViewWrapper
      className={cn(
        "inline-list relative min-w-0 flex items-stretch",
        sizing === "fill" && "flex-1 basis-0 min-w-1",
        sizing === "hug" && "shrink-0",
        ...nodeAttrClasses({ font, size, background }),
      )}
    >
      <NodeViewContent className="flex flex-wrap items-center gap-1.5 w-full" />
    </NodeViewWrapper>
  );
}
