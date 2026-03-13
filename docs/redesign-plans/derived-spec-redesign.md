# Redesign: Derived Spec

## Summary

The template spec becomes a **computed artifact derived from the LaTeX source** on every save. It is no longer authored or stored independently. The `optional` property on `FieldDef` is removed entirely.

---

## What Changes

### 1. Spec is derived, not authored

**Before:** Spec is a standalone JSON object stored alongside the template, manually kept in sync with the LaTeX source.

**After:** On every LaTeX save, the parser produces a fresh `TemplateSpec` from the template commands. This derived spec is cached on the template record for fast access but is never edited directly.

The pipeline becomes:

```
LaTeX (source of truth)
  → parse → TemplateSpec (derived, cached)
  → diff previous spec → update Layout (auto-append new fields, warn on removals)
```

The LaTeX update, derived spec, and layout update are written in a **single database transaction**. If any step fails, everything rolls back — the previous spec and layout are retained. This eliminates the class of desync bugs that motivated the redesign.

### 2. Remove `optional` from `FieldDef`

**Before:**

```typescript
type FieldDef = { id: string; optional?: boolean };
```

**After:**

```typescript
type FieldDef = { id: string };
```

The `optional` property served one purpose: telling the templating engine whether to render empty fields. This is already handled by `\begin{if}{id}` in the LaTeX source. If a template author wants a field to be skippable when empty, they wrap it in an `if` block — the LaTeX is already the source of truth for this behavior. Storing `optional` separately is redundant.

### 3. Spec no longer appears in template creation/editing flows

Template authors interact with two things: the **LaTeX editor** (defines structure) and the **layout editor** (arranges fields in the content editor). The spec is an internal implementation detail that neither surface exposes directly.

---

## Type Changes

### FieldDef

```diff
- type FieldDef = { id: string; optional?: boolean };
+ type FieldDef = { id: string };
```

### Template (data model)

The spec field remains on the `Template` type but is treated as a derived cache, not user input.

```typescript
type Template = {
  id: string;
  name: string;
  type: "resume" | "coverLetter";
  latex: string;
  spec: TemplateSpec; // derived from latex on save
  layout: TemplateLayout;
};
```

---

## Parser → Spec Derivation

On LaTeX save, the parser walks the AST and builds the spec:

| LaTeX command            | Produces                         |
| ------------------------ | -------------------------------- |
| `\field{id}`             | `FieldDef` in current scope      |
| `\list{id}`              | `ListDef` in current scope       |
| `\inlinelist{id}{sep}`   | `InlineListDef` in current scope |
| `\begin{group-list}{id}` | `GroupListDef`, push new scope   |
| `\end{group-list}`       | Pop scope                        |

Scope tracking uses the same stack already needed for group-list iteration. Each scope accumulates its own fields, lists, inline lists, and nested group lists.

**Deduplication:** If the same ID appears multiple times within a scope (e.g. `\field{name}` used twice), it produces a single `FieldDef`. Cross-namespace collisions (a field and a list sharing the same ID) remain a validation error.

---

## Layout Sync (revised Section 5)

The sync process simplifies from a three-way reconciliation to a two-step pipeline:

### Step 1: Derive spec from LaTeX

Deterministic, no ambiguity. The parser output _is_ the spec.

### Step 2: Diff spec → update layout

Compare the new derived spec against the previous derived spec. On **first save** (no previous spec exists), the entire derived spec is treated as "everything added" and a full default layout is auto-generated.

For subsequent saves:

- **Field/list added:** Append a default layout node at the end of the relevant scope.
- **Field/list removed:** Remove from layout. Warn about orphaned content in existing files (don't delete content — the user may re-add the field). Clean up any `_hidden` references to the removed ID.
- **Type changed** (e.g. `\list` → `\inlinelist`): Migrate the node in layout. Migrate content in existing files (`ListItem[]` → `string[]` by extracting `.text`; reverse seeds `style` from `defaultItemStyle`).

### Validation errors (block save)

- **Parse failure** (malformed LaTeX, unmatched braces): Save is blocked. The previous spec and layout are retained. The user sees the parse error with a line number.
- Same ID used as both `\list` and `\inlinelist` within a scope.
- Unmatched `\begin`/`\end` pairs.

### Warnings (non-blocking)

- Spec field missing from layout (auto-appended, but worth flagging).
- Orphaned content in files for removed fields.

---

## What Doesn't Change

- **`TemplateSpec` type definition** stays (minus `optional`). It's still a useful data structure referenced by layout validation, content validation, the content editor, and AI tailoring.
- **`TemplateLayout` type definition** stays as-is.
- **`FileContent` type definition** stays as-is.
- **Templating engine** stays as-is. It already uses `\begin{if}` for conditional rendering and never read the `optional` property.
- **Content editor** stays as-is. It reads the layout, not the spec directly.
- **AI tailoring** stays as-is. It operates on content, not the spec.
