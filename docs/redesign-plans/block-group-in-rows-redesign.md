# Redesign: Block Groups in Rows

## Summary

Introduce a `BlockGroup` wrapper node for contiguous elements within a row. Grouped blocks render with tighter spacing in the content editor, letting visually related elements (e.g. "Aug 2018 – May 2021") read as a single unit. This is a **layout-only** change — content, LaTeX, spec derivation, and the templating engine are unaffected.

---

## What Changes

### 1. New `BlockGroup` type in layout

A row's `blocks` array can now contain `BlockGroup` nodes alongside the existing flat block types. A `BlockGroup` wraps a contiguous subset of blocks into a single visual unit.

```typescript
type RowBlock = Field | Decorator | List | InlineList | BlockGroup;

type BlockGroup = {
  type: "group";
  sizing: "fill" | "hug";
  blocks: (Field | Decorator | InlineList)[];
};
```

A `BlockGroup` participates in the row's sizing logic as a single item. Internally, its children always hug — the group's own `sizing` property determines how it relates to the rest of the row.

### 2. Row sizing invariant (unchanged, extended)

The existing rule — "every row must be fully covered; if multiple items share a row, exactly one is `fill`" — continues to apply. A `BlockGroup` counts as one item at the row level. Its children do not participate in the row-level sizing calculation.

### 3. Content editor rendering

Grouped blocks render with a smaller gap (e.g. 4px) between them than ungrouped top-level blocks (e.g. 12px). No other visual distinction — no border, no background, no wrapper chrome. The tighter spacing is the only signal.

### 4. Layout editor support

The layout editor (when built) will support grouping and ungrouping:

- **Group:** Select contiguous blocks in a row → "Group" action. Validates adjacency constraints (see below).
- **Ungroup:** Select a group → "Ungroup" action. Promotes children back to the row's top-level blocks array in place.
- **Drag into/out of groups:** Drag a block into an existing group (appended at the drop position) or out (promoted to row level). Validates constraints on drop.

Until the layout editor is built, template creators edit the layout JSON directly.

---

## Type Changes

### RowBlock

```diff
- type RowBlock = Field | Decorator | List | InlineList;
+ type RowBlock = Field | Decorator | List | InlineList | BlockGroup;
+
+ type BlockGroup = {
+   type: "group";
+   sizing: "fill" | "hug";
+   blocks: (Field | Decorator | InlineList)[];
+ };
```

### What stays the same

- `TemplateSpec` — unaffected. Groups are a layout concept; the spec doesn't know about them.
- `FileContent` — unaffected. Content is keyed by field/list IDs, not layout structure.
- `TemplateLayout` — the type widens (`RowBlock` gains a variant) but no existing properties change.
- Templating engine — reads content + LaTeX, never layout.
- LaTeX editor / spec derivation — groups don't appear in LaTeX.
- AI tailoring — operates on content, not layout.

---

## Adjacency Constraints

Within a `BlockGroup`, the following adjacency rules are enforced on layout save:

| Adjacent pair             | Allowed? | Reason                                                          |
| ------------------------- | -------- | --------------------------------------------------------------- |
| Field – Decorator – Field | ✓        | Decorator separates them                                        |
| Field – Field             | ✗        | Visually ambiguous; unclear where one ends and the other begins |
| InlineList – InlineList   | ✗        | Same ambiguity                                                  |
| Field – InlineList        | ✗        | Same ambiguity (both are editable text)                         |
| Decorator – Decorator     | ✗        | Redundant; merge into one decorator                             |
| Field – Decorator         | ✓        | Fine                                                            |
| InlineList – Decorator    | ✓        | Fine                                                            |
| Decorator – Field         | ✓        | Fine                                                            |
| Decorator – InlineList    | ✓        | Fine                                                            |

**In short:** every editable element (Field or InlineList) must be separated from every other editable element by at least one Decorator. Decorators themselves cannot be adjacent.

These constraints only apply **within** a `BlockGroup`. At the top level of a row, adjacent Fields remain valid (they're separated by the normal row gap).

### Why `List` is excluded from groups

Block lists (`type: "list"`) render vertically and have their own distinct visual identity (bullets, numbering). Nesting a vertical list inside a horizontal tight-gap group creates layout ambiguity. Lists remain top-level row blocks only. `InlineList` is allowed inside groups since it renders horizontally.

### Minimum group size

A group must contain at least 2 blocks. A single-block group is meaningless — validation rejects it.

---

## Validation

Validation runs on layout save (both from the layout editor and from the layout–spec sync pipeline). Errors block save.

### Errors

- **Adjacent editable blocks:** Two Fields, two InlineLists, or a Field and InlineList are adjacent within a group.
- **Adjacent Decorators:** Two Decorators are adjacent within a group.
- **Empty group:** Group contains fewer than 2 blocks.
- **Nested group:** A BlockGroup contains another BlockGroup. Groups do not nest.
- **List in group:** A `List` (block list) appears inside a group.

### Non-blocking

- A group containing only Decorators (no editable blocks). Unusual but not harmful.

---

## Layout–Spec Sync Impact

The sync pipeline (section 5 of the implementation plan) needs minor updates:

### Field/list added

When a new field or list is auto-appended to the layout, it is always added as a **top-level** row block, never inside an existing group. The template author can group it manually afterward.

### Field/list removed

If the removed field/list is inside a group:

1. Remove the block from the group.
2. If the removal leaves adjacent Decorators, merge them or remove one.
3. If the group drops below 2 blocks, dissolve it — promote the remaining block(s) to the row level.
4. Clean up any `_hidden` references as before.

### Type changed

If a `List` becomes an `InlineList`, and the InlineList's new position is inside a group, validate adjacency constraints. If invalid, promote the block out of the group. If an `InlineList` becomes a `List`, it must be promoted out of any group (lists can't be in groups).

---

## Content Editor Changes

### Rendering

The content editor's row renderer checks each top-level block:

- If `type === "group"`, render its children in a flex container with `gap: 4px` (tight).
- Otherwise, render the block normally with the standard row gap (e.g. `gap: 12px`).

The group wrapper is a purely visual `div` with no interactive affordances in content mode.

### Focus and cursor behavior

Tab order flows through group children the same as ungrouped blocks — left to right, group children in sequence. No special keyboard handling needed.

### Hidden fields in groups

If a field inside a group is `hideable` and currently hidden, it disappears from the group. If this leaves the group with fewer than 2 **visible** blocks, the remaining block(s) still render — just without the group wrapper. The `_hidden` invariant is unchanged; the minimum-2 rule applies to the **stored** layout, not the runtime visible count.

---

## Migration

Existing layouts have no `BlockGroup` nodes and continue to work unchanged. No migration is required — the new type is additive. Template authors can opt into grouping by editing their layout JSON or (eventually) using the layout editor.

### Example: Grouping the date range

Before:

```json
{
  "type": "row",
  "blocks": [
    { "type": "field", "fieldId": "entryTitle", "sizing": "fill" },
    { "type": "field", "fieldId": "startDate", "sizing": "hug" },
    { "type": "decorator", "text": " – " },
    { "type": "field", "fieldId": "endDate", "sizing": "hug" }
  ]
}
```

After:

```json
{
  "type": "row",
  "blocks": [
    { "type": "field", "fieldId": "entryTitle", "sizing": "fill" },
    {
      "type": "group",
      "sizing": "hug",
      "blocks": [
        { "type": "field", "fieldId": "startDate", "sizing": "hug" },
        { "type": "decorator", "text": " – " },
        { "type": "field", "fieldId": "endDate", "sizing": "hug" }
      ]
    }
  ]
}
```

The row now has two top-level items: `entryTitle` (fill) and the date group (hug). Inside the group, the three blocks render with tight spacing.

---

## What Doesn't Change

- **`TemplateSpec`** — groups are not part of the spec.
- **`FileContent`** — content is addressed by ID, not layout position.
- **Templating engine** — reads content + LaTeX only.
- **LaTeX editor / spec derivation** — groups don't appear in LaTeX.
- **AI tailoring** — operates on content.
- **`_hidden` invariant** — unchanged; guard still runs on field IDs regardless of grouping.
- **Row centering logic** — still inferred from top-level sizing. A row of all-hug top-level items (including groups with `sizing: "hug"`) centers.
