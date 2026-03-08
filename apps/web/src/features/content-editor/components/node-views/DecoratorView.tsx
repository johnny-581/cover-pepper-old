import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

export function DecoratorView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper
      as="span"
      className="flex-shrink-0 select-none text-muted-foreground text-sm flex items-center"
      contentEditable={false}
    >
      {node.attrs.text as string}
    </NodeViewWrapper>
  );
}
