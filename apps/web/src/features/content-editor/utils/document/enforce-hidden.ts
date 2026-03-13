import type {
  BlockGroup,
  GroupList,
  GroupListInstance,
  LayoutNode,
  RowBlock,
} from "@pepper-apply/shared";

type HideableKind = "field" | "list" | "inlinelist";

type HideableEntry = {
  id: string;
  kind: HideableKind;
};

type GroupChildBlock = BlockGroup["blocks"][number];
type LayoutBlock = LayoutNode | RowBlock | GroupChildBlock;

type IndexedRowBlock = {
  block: RowBlock;
  sourceIndex: number;
};

type IndexedGroupBlock = {
  block: GroupChildBlock;
  sourceIndex: number;
};

const HIDEABLE_KINDS = new Set<HideableKind>(["field", "list", "inlinelist"]);

export function enforceHidden(
  instance: GroupListInstance,
  layout: GroupList["layout"],
): void {
  if (!instance._hidden?.length) {
    instance._hidden = undefined;
    return;
  }

  const hideableById = collectHideableEntries(layout);
  const nextHidden: string[] = [];
  const seen = new Set<string>();

  for (const id of instance._hidden) {
    if (typeof id !== "string" || seen.has(id)) continue;
    seen.add(id);

    const hideable = hideableById.get(id);
    if (!hideable) continue;
    if (!isEmptyForHidden(instance, hideable)) continue;
    nextHidden.push(id);
  }

  instance._hidden = nextHidden.length > 0 ? nextHidden : undefined;
}

export function sanitizeHiddenIdsForLayout(
  hiddenIds: string[] | undefined,
  layout: GroupList["layout"],
): string[] | undefined {
  if (!hiddenIds?.length) return undefined;

  const hideableIds = collectHideableEntries(layout);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const id of hiddenIds) {
    if (typeof id !== "string" || seen.has(id)) continue;
    if (!hideableIds.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result.length > 0 ? result : undefined;
}

export function hiddenTargetId(block: LayoutBlock): string | null {
  if (block.type === "field") return block.fieldId;
  if (block.type === "list" || block.type === "inlinelist") return block.listId;
  return null;
}

export function filterHiddenRowBlocks(
  blocks: RowBlock[],
  hiddenIds: Set<string>,
): RowBlock[] {
  const fillTransferTriggers: number[] = [];
  const visibleBlocks: IndexedRowBlock[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === "decorator") {
      visibleBlocks.push({ block, sourceIndex: index });
      continue;
    }

    if (block.type === "group") {
      const visibleChildren = filterGroupBlocks(block.blocks, hiddenIds);

      if (visibleChildren.length === 0) {
        if (block.sizing === "fill") {
          fillTransferTriggers.push(index);
        }
        continue;
      }

      if (visibleChildren.length === 1) {
        const flattened = flattenGroupChild(visibleChildren[0], block.sizing);
        if (block.sizing === "fill" && !isFillSizableRowBlock(flattened)) {
          fillTransferTriggers.push(index);
        }
        visibleBlocks.push({
          block: flattened,
          sourceIndex: index,
        });
        continue;
      }

      visibleBlocks.push({
        block: { ...block, blocks: visibleChildren },
        sourceIndex: index,
      });
      continue;
    }

    const id = hiddenTargetId(block);
    const isHidden = id != null && hiddenIds.has(id);
    if (isHidden) {
      if (isFillTransferTrigger(block)) {
        fillTransferTriggers.push(index);
      }
      continue;
    }

    visibleBlocks.push({ block, sourceIndex: index });
  }

  const cleanedBlocks = filterIndexedDecorators(visibleBlocks, ({ block }) =>
    isEditableRowBlock(block)
  );
  if (fillTransferTriggers.length === 0) {
    return cleanedBlocks.map(({ block }) => block);
  }

  const promotedIndexes = new Set<number>();
  for (const triggerIndex of fillTransferTriggers) {
    const targetIndex = findLeftFillTransferTarget(cleanedBlocks, triggerIndex);
    if (targetIndex != null) {
      promotedIndexes.add(targetIndex);
    }
  }

  return cleanedBlocks.map(({ block }, index) => {
    if (!promotedIndexes.has(index)) {
      return block;
    }

    return withFillSizing(block);
  });
}

export function filterGroupBlocks(
  blocks: GroupChildBlock[],
  hiddenIds: Set<string> = new Set<string>(),
): GroupChildBlock[] {
  const visible: IndexedGroupBlock[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type === "decorator") {
      visible.push({ block, sourceIndex: index });
      continue;
    }

    const id = hiddenTargetId(block);
    if (id != null && hiddenIds.has(id)) {
      continue;
    }
    visible.push({ block, sourceIndex: index });
  }

  return filterIndexedDecorators(
    visible,
    ({ block }) => isEditableGroupBlock(block),
    "either",
  ).map(({ block }) => block);
}

function flattenGroupChild(
  block: GroupChildBlock,
  groupSizing: BlockGroup["sizing"],
): RowBlock {
  if (groupSizing !== "fill") {
    return block;
  }

  if (block.type !== "field" && block.type !== "inlinelist") {
    return block;
  }

  if (block.sizing === "fill") {
    return block;
  }

  return {
    ...block,
    sizing: "fill",
  };
}

function isEditableGroupBlock(block: GroupChildBlock): boolean {
  return block.type === "field" || block.type === "inlinelist";
}

function isEditableRowBlock(block: RowBlock): boolean {
  if (block.type === "field" || block.type === "list" || block.type === "inlinelist") {
    return true;
  }

  if (block.type !== "group") {
    return false;
  }

  return block.blocks.some((child) => isEditableGroupBlock(child));
}

function filterIndexedDecorators<T extends { type: string }>(
  blocks: Array<{ block: T; sourceIndex: number }>,
  isEditable: (entry: { block: T; sourceIndex: number }) => boolean,
  policy: "both" | "either" = "both",
): Array<{ block: T; sourceIndex: number }> {
  return blocks.filter((entry, index) => {
    if (entry.block.type !== "decorator") {
      return true;
    }

    const hasLeftNeighbor = hasEditableNeighbor(blocks, index, -1, isEditable);
    const hasRightNeighbor = hasEditableNeighbor(blocks, index, 1, isEditable);

    if (policy === "either") {
      return hasLeftNeighbor || hasRightNeighbor;
    }

    return hasLeftNeighbor && hasRightNeighbor;
  });
}

function hasEditableNeighbor<T extends { type: string }>(
  blocks: Array<{ block: T; sourceIndex: number }>,
  fromIndex: number,
  direction: -1 | 1,
  isEditable: (entry: { block: T; sourceIndex: number }) => boolean,
): boolean {
  for (
    let index = fromIndex + direction;
    index >= 0 && index < blocks.length;
    index += direction
  ) {
    const entry = blocks[index];
    if (entry.block.type === "decorator") continue;
    return isEditable(entry);
  }

  return false;
}

function findLeftFillTransferTarget(
  blocks: IndexedRowBlock[],
  triggerSourceIndex: number,
): number | null {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const entry = blocks[index];
    if (entry.sourceIndex >= triggerSourceIndex) continue;
    if (!isFillSizableRowBlock(entry.block)) continue;
    return index;
  }

  return null;
}

function isFillTransferTrigger(block: RowBlock): boolean {
  return (block.type === "field" || block.type === "inlinelist")
    && block.sizing === "fill";
}

function isFillSizableRowBlock(block: RowBlock): boolean {
  return block.type === "field" || block.type === "inlinelist" || block.type === "group";
}

function withFillSizing(block: RowBlock): RowBlock {
  if (block.type === "field" || block.type === "inlinelist" || block.type === "group") {
    if (block.sizing === "fill") {
      return block;
    }

    return {
      ...block,
      sizing: "fill",
    };
  }

  return block;
}

function collectHideableEntries(layout: LayoutNode[]): Map<string, HideableEntry> {
  const entries = new Map<string, HideableEntry>();

  for (const node of layout) {
    if (node.type === "row") {
      for (const block of node.blocks) {
        collectHideableEntriesFromRowBlock(block, entries);
      }
      continue;
    }

    if (node.type === "groupList") {
      continue;
    }

    const entry = toHideableEntry(node);
    if (entry) {
      entries.set(entry.id, entry);
    }
  }

  return entries;
}

function collectHideableEntriesFromRowBlock(
  block: RowBlock,
  entries: Map<string, HideableEntry>,
): void {
  if (block.type === "group") {
    for (const child of block.blocks) {
      const entry = toHideableEntry(child);
      if (entry) {
        entries.set(entry.id, entry);
      }
    }
    return;
  }

  const entry = toHideableEntry(block);
  if (entry) {
    entries.set(entry.id, entry);
  }
}

function toHideableEntry(block: LayoutBlock): HideableEntry | null {
  if (!HIDEABLE_KINDS.has(block.type as HideableKind)) {
    return null;
  }

  if (!("hideable" in block) || !block.hideable) {
    return null;
  }

  const id = hiddenTargetId(block);
  if (!id) return null;

  return { id, kind: block.type as HideableKind };
}

function isEmptyForHidden(
  instance: GroupListInstance,
  hideable: HideableEntry,
): boolean {
  if (hideable.kind === "field") {
    const value = instance.fields[hideable.id];
    return value == null || value === "";
  }

  if (hideable.kind === "list") {
    const value = instance.lists[hideable.id];
    return (
      value == null ||
      value.length === 0 ||
      value.every((item) => (item.text ?? "") === "")
    );
  }

  const value = instance.inlineLists[hideable.id];
  return (
    value == null ||
    value.length === 0 ||
    value.every((item) => item === "")
  );
}
