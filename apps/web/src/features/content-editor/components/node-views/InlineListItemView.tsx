import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

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
    <NodeViewWrapper className="inline-list-item relative flex items-center min-w-0">
      <div
        className="relative min-w-0 px-1.5"
      >
        {/* Reserve width so empty placeholders center the same way as fields. */}
        {showPlaceholder && (
          <span className="invisible whitespace-nowrap h-0 block overflow-hidden">
            {placeholderText}
          </span>
        )}
        <div
          className="relative min-w-0"
          data-placeholder={showPlaceholder ? placeholderText : undefined}
        >
          <NodeViewContent className="[&_p]:m-0 leading-[inherit] min-w-px" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
