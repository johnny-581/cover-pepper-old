import type {
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

type LayoutBlock = LayoutNode | RowBlock;

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
  const hiddenFillTriggers: number[] = [];
  const keepEditable = blocks.map((block, index) => {
    if (!HIDEABLE_KINDS.has(block.type as HideableKind)) {
      return false;
    }

    const id = hiddenTargetId(block);
    if (!id) return false;
    const isHidden = hiddenIds.has(id);
    if (isHidden && isFillTransferTrigger(block)) {
      hiddenFillTriggers.push(index);
    }
    return !isHidden;
  });

  const visibleBlocks = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block, index }) => {
      if (block.type !== "decorator") {
        return keepEditable[index];
      }

      return hasVisibleEditable(keepEditable, blocks, index, -1)
        && hasVisibleEditable(keepEditable, blocks, index, 1);
    });

  if (hiddenFillTriggers.length === 0) {
    return visibleBlocks.map(({ block }) => block);
  }

  const promotedOriginalIndexes = new Set<number>();
  for (const triggerIndex of hiddenFillTriggers) {
    const targetIndex = findLeftFillTransferTarget(
      blocks,
      keepEditable,
      triggerIndex,
    );
    if (targetIndex != null) {
      promotedOriginalIndexes.add(targetIndex);
    }
  }

  return visibleBlocks.map(({ block, index }) => {
    if (!promotedOriginalIndexes.has(index)) {
      return block;
    }

    return withFillSizing(block);
  });
}

function hasVisibleEditable(
  keepEditable: boolean[],
  blocks: RowBlock[],
  fromIndex: number,
  direction: -1 | 1,
): boolean {
  for (
    let index = fromIndex + direction;
    index >= 0 && index < blocks.length;
    index += direction
  ) {
    if (blocks[index].type === "decorator") continue;
    return keepEditable[index];
  }

  return false;
}

function findLeftFillTransferTarget(
  blocks: RowBlock[],
  keepEditable: boolean[],
  triggerIndex: number,
): number | null {
  for (let index = triggerIndex - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (block.type === "decorator") continue;
    if (!keepEditable[index]) continue;

    if (block.type === "field" || block.type === "inlinelist") {
      return index;
    }
  }

  return null;
}

function isFillTransferTrigger(block: RowBlock): boolean {
  return (block.type === "field" || block.type === "inlinelist")
    && block.sizing === "fill";
}

function withFillSizing(block: RowBlock): RowBlock {
  if (block.type === "field" || block.type === "inlinelist") {
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
        const entry = toHideableEntry(block);
        if (entry) {
          entries.set(entry.id, entry);
        }
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
