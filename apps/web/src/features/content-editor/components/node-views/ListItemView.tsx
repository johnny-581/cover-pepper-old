import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

export function ListItemView({ editor, getPos, node }: NodeViewProps) {
  const pos = getPos();

  let isInline = false;
  let isBulleted = false;
  let showPlaceholder = false;
  let placeholderText = "";

  if (typeof pos === "number") {
    const $pos = editor.state.doc.resolve(pos);
    const parentNode = $pos.parent;

    if (parentNode.type.name === "list") {
      isInline = parentNode.attrs.inline === true;
      isBulleted = !isInline && parentNode.attrs.display === "bulleted";

      const parentPlaceholder = parentNode.attrs.placeholder;
      placeholderText =
        typeof parentPlaceholder === "string"
          ? parentPlaceholder
          : String(parentPlaceholder ?? "");

      const isSingleItemList = parentNode.childCount === 1;
      const isFirstItem = $pos.index() === 0;
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
      className={cn(
        "px-1.5",
        isInline ? "flex items-baseline" : "flex items-baseline",
      )}
    >
      {isBulleted && (
        <span
          contentEditable={false}
          className="select-none text-muted-foreground text-sm ml-1 mr-2 mt-px shrink-0 leading-none"
          aria-hidden
        >
          •
        </span>
      )}
      <div
        className="relative min-w-0 flex-1"
        data-placeholder={showPlaceholder ? placeholderText : undefined}
      >
        <NodeViewContent className="[&_p]:m-0 leading-[inherit] min-w-px" />
      </div>
    </NodeViewWrapper>
  );
}
