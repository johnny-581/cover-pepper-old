import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import type { ListItemStyle } from "@pepper-apply/shared";

function normalizeListItemStyle(style: unknown): ListItemStyle {
  if (style === "plain" || style === "bullet" || style === "numbered") {
    return style;
  }

  return "plain";
}

function resolveNumberedRunIndex(
  parentNode: NodeViewProps["node"],
  itemIndex: number,
): number {
  let count = 1;

  for (let index = itemIndex - 1; index >= 0; index -= 1) {
    const siblingStyle = normalizeListItemStyle(parentNode.child(index).attrs.style);
    if (siblingStyle !== "numbered") {
      break;
    }

    count += 1;
  }

  return count;
}

export function ListItemView({ editor, getPos, node }: NodeViewProps) {
  const pos = getPos();

  let marker: string | null = null;
  let showPlaceholder = false;
  let placeholderText = "";

  if (typeof pos === "number") {
    const $pos = editor.state.doc.resolve(pos);
    const parentNode = $pos.parent;

    if (parentNode.type.name === "list") {
      const parentPlaceholder = parentNode.attrs.placeholder;
      placeholderText =
        typeof parentPlaceholder === "string"
          ? parentPlaceholder
          : String(parentPlaceholder ?? "");

      const isSingleItemList = parentNode.childCount === 1;
      const itemIndex = $pos.index();
      const isFirstItem = itemIndex === 0;
      const isItemEmpty = node.textContent.length === 0;

      showPlaceholder =
        placeholderText.length > 0 &&
        isSingleItemList &&
        isFirstItem &&
        isItemEmpty;

      const style = normalizeListItemStyle(node.attrs.style);
      if (style === "bullet") {
        marker = "•";
      } else if (style === "numbered") {
        const number = resolveNumberedRunIndex(parentNode, itemIndex);
        marker = `${number}.`;
      }
    }
  }

  return (
    <NodeViewWrapper className="px-1.5 flex items-baseline">
      {marker && (
        <span
          contentEditable={false}
          className="select-none text-muted-foreground text-sm ml-1 mr-2 mt-px shrink-0 leading-none"
          aria-hidden
        >
          {marker}
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
