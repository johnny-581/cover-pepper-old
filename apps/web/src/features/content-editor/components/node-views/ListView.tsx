import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { nodeAttrClasses } from "./node-view-utils";

export function ListView({ node }: NodeViewProps) {
  const { font, size, background, defaultFormat, sizing } = node.attrs;

  return (
    <NodeViewWrapper
      className={cn(
        "relative min-w-0 flex flex-col",
        sizing === "fill" && "flex-1 basis-0 min-w-1",
        sizing === "hug" && "shrink-0",
        ...nodeAttrClasses({ font, size, background, defaultFormat }),
      )}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
