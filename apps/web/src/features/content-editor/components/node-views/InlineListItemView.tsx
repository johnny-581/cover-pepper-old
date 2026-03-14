import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { NODE_PADDING } from "./node-view-utils";

export function InlineListItemView({ editor, getPos, node }: NodeViewProps) {
  const pos = getPos();

  let showPlaceholder = false;
  let placeholderText = "";

  if (typeof pos === "number") {
    const $pos = editor.state.doc.resolve(pos);
    const parentNode = $pos.parent;

    if (parentNode.type.name === "inlineList") {
      const parentPlaceholder = parentNode.attrs.placeholder;
      placeholderText =
        typeof parentPlaceholder === "string"
          ? parentPlaceholder
          : String(parentPlaceholder ?? "");

      const itemIndex = $pos.index();
      const isSingleItemList = parentNode.childCount === 1;
      const isFirstItem = itemIndex === 0;
      const isItemEmpty = node.textContent.length === 0;

      showPlaceholder =
        placeholderText.length > 0 &&
        isSingleItemList &&
        isFirstItem &&
        isItemEmpty;
    }
  }

  return (
    <NodeViewWrapper
      className={cn(NODE_PADDING, "relative flex items-center min-w-0")}
    >
      <div
        className="relative min-w-0"
        data-placeholder={showPlaceholder ? placeholderText : undefined}
      >
        {/* Reserve width so empty placeholders center the same way as fields.
            Must live inside this div (not as a flex sibling) so it sizes the
            div without offsetting the ::before pseudo-element. */}
        {showPlaceholder && (
          <span className="invisible whitespace-nowrap h-0 block overflow-hidden">
            {placeholderText}
          </span>
        )}
        <NodeViewContent className="[&_p]:m-0 leading-[inherit] min-w-px" />
      </div>
    </NodeViewWrapper>
  );
}
