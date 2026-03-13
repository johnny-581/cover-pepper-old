# Implementation Plan

---

## 1. Tech Stack

| Concern           | Choice                                   |
| ----------------- | ---------------------------------------- |
| Frontend          | Vite-React + TanStack Router + shadcn/ui |
| Backend           | Fastify + tRPC                           |
| Database          | Postgres + Prisma                        |
| State             | Zustand + Immer                          |
| Rich text editor  | Tiptap                                   |
| Code editor       | Monaco                                   |
| DnD               | dnd-kit                                  |
| LaTeX compilation | Tectonic in a container                  |
| PDF preview       | react-pdf (pdf.js wrapper)               |
| Auth              | Clerk                                    |

---

## 2. Type Definitions

### Template Spec

The spec is **derived from the LaTeX source** on every save — it is never authored or stored independently. The parser produces a fresh `TemplateSpec` from the template commands, and this derived spec is cached on the template record for fast access.

```typescript
type TemplateSpec = {
  fields: FieldDef[];
  lists: ListDef[];
  inlineLists: InlineListDef[];
  groupLists: GroupListDef[];
};

type FieldDef = { id: string };
type ListDef = { id: string };
type InlineListDef = { id: string };
type GroupListDef = {
  id: string;
  fields: FieldDef[];
  lists: ListDef[];
  inlineLists: InlineListDef[];
  groupLists: GroupListDef[];
};
```

### Layout

The layout is a tree of nodes that controls how fields are arranged in the content editor. It references field and list IDs from the derived spec. Field, List, and InlineList share a unified set of flat styling properties — no wrapper objects.

```typescript
type TemplateLayout = LayoutNode[];
type LayoutNode = Row | List | InlineList | GroupList;

type Row = { type: "row"; blocks: RowBlock[] };

type GroupList = {
  type: "groupList";
  groupListId: string;
  layout: LayoutNode[];
};

type RowBlock = Field | Decorator | List | InlineList;

type FontFamily = "sans" | "serif";
type FontSize = "small" | "normal" | "heading";
type Background = "none" | "grey" | "yellow";
type DefaultFormat = { bold?: boolean; italic?: boolean; underline?: boolean };
type ListItemStyle = "plain" | "bullet" | "numbered";

type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean; // default: false — can be collapsed when empty in group list instances
  placeholder?: string; // default: ""
  font?: FontFamily; // default: "sans"
  size?: FontSize; // default: "normal"
  background?: Background; // default: "none"
  // Seed formatting for new content
  defaultFormat?: DefaultFormat; // default: { bold: false, italic: false, underline: false }
};

type Decorator = { type: "decorator"; text: string };

type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean; // default: false
  placeholder?: string; // default: ""
  font?: FontFamily; // default: "sans"
  size?: FontSize; // default: "normal"
  background?: Background; // default: "none"
  // Seed values for new items
  defaultFormat?: DefaultFormat; // default: { bold: false, italic: false, underline: false }
  defaultItemStyle?: ListItemStyle; // default: "plain"
};

type InlineList = {
  type: "inlinelist";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean; // default: false
  placeholder?: string; // default: ""
  font?: FontFamily; // default: "sans"
  size?: FontSize; // default: "normal"
  background?: Background; // default: "none"
  // Seed formatting for new items
  defaultFormat?: DefaultFormat; // default: { bold: false, italic: false, underline: false }
};
```

Only `type`, `fieldId`/`listId`, and `sizing` are required. All other properties fall back to sensible defaults when omitted. `DefaultFormat` inner fields also default to `false` — `{ bold: true }` is equivalent to `{ bold: true, italic: false, underline: false }`.

A minimal field:

```typescript
{ type: "field", fieldId: "location", sizing: "fill" }
```

A bold heading only overrides what's different:

```typescript
{ type: "field", fieldId: "sectionTitle", sizing: "fill", size: "heading", defaultFormat: { bold: true } }
```

A hideable field that can be collapsed when empty:

```typescript
{ type: "field", fieldId: "location", sizing: "fill", hideable: true }
```

### Row Centering

Auto-inferred from sizing, not stored as a property. If every block in a row has `sizing: "hug"`, the row centers its contents. If at least one block is `"fill"`, it stretches to absorb remaining space. Template authors control centering purely through sizing choices.

### File Content

Content is split into `fields`, `lists`, `inlineLists`, and `groupLists` so it's self-describing. Block lists store per-item style metadata; inline lists store plain strings.

```typescript
type ListItem = {
  style: ListItemStyle;
  text: string; // richtext HTML
};

type FileContent = {
  fields: Record<string, string>; // richtext HTML
  lists: Record<string, ListItem[]>; // block lists — per-item style
  inlineLists: Record<string, string[]>; // inline lists — plain strings
  groupLists: Record<string, GroupListInstance[]>;
};

type GroupListInstance = {
  _key: string; // nanoid(8)
  _hidden?: string[]; // IDs of fields/lists collapsed in the editor — undefined when nothing hidden
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};
```

### Hidden Fields

`_hidden` is per-instance metadata that tracks which fields and lists are collapsed in the content editor. It is purely an editor concern — the templating engine ignores it entirely, and all content renders regardless of visibility.

**Invariant:** `_hidden` may only contain IDs where (a) the layout marks the field/list as `hideable` and (b) the content is empty. This is enforced by a guard after every content mutation:

```typescript
function enforceHidden(instance: GroupListInstance, layout: GroupList) {
  if (!instance._hidden?.length) return;
  const result = instance._hidden.filter(
    (id) => isHideable(layout, id) && isEmpty(instance, id),
  );
  instance._hidden = result.length ? result : undefined;
}
```

This covers two cases: content becoming non-empty (auto-reveal) and `hideable` being removed from a field in the layout (stale cleanup).

**Initial state:** Template `sampleContent` seeds `_hidden` on each group list instance. The template author controls which hideable fields start collapsed.

**New instance inheritance:** A new instance inherits `_hidden` from the preceding sibling (or first sibling if inserting at position 0). Empty group list falls back to `undefined`. Safe by construction — new instances start with all fields empty, so the inherited set always satisfies the invariant.

### Versioning

```typescript
type FileVersion = {
  id: string; // nanoid(8), prefixed "v_"
  label?: string; // e.g. "Google variant"
  content: FileContent;
  createdAt: string;
};

type File = {
  id: string; // cuid
  templateId: string;
  versions: FileVersion[];
  activeVersionId: string;
};
```

Creating a version clones the active content. Switching versions swaps content; the template stays the same. The last version can't be deleted. AI tailoring always creates a new version.

### IDs

| Entity                    | Type                         | Example                  |
| ------------------------- | ---------------------------- | ------------------------ |
| Field / group / list defs | Human-readable               | `"heading"`, `"entries"` |
| Group instances           | `nanoid(8)`                  | `"k8f2j1mx"`             |
| File versions             | `nanoid(8)` with `v_` prefix | `"v_a1b2c3d4"`           |
| DB records                | cuid                         | `"clx7..."`              |

---

## 3. Default Formatting

`defaultFormat` on a Field, List, or InlineList seeds the editor state when new content is created. It is never read at render time — formatting lives entirely in the content HTML.

**When defaults apply:**

- **New list item** (Enter key): editor activates the formatting marks from `defaultFormat`. User types in bold if `defaultFormat.bold` is true. Can be toggled off via toolbar.
- **New group list instance** (`+` button): each field within it reads its own `defaultFormat` and pre-activates those marks.
- **Empty field reset**: clearing all text and retyping re-applies `defaultFormat`.

**In the editor:** `defaultFormat` is reflected as base CSS on the field. If `defaultFormat.bold` is true, the field text appears bold and the toolbar shows "B" as active. Users can still apply additional inline formatting on top.

> Configuring `defaultFormat` is deferred to the Layout Editor. Until then, values are set in the layout JSON.

---

## 4. Templating Engine

Takes a LaTeX template + `FileContent` → final LaTeX string. The engine does not read layout data — it only needs the template and the content. In particular, the engine ignores `_hidden` entirely; all content renders regardless of editor visibility. Empty fields are already handled by `\begin{if}`.

### Commands

| Command                                          | What it does                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `\field{id}`                                     | Insert field value. Empty → empty string.                                                                          |
| `\list{id}`                                      | Render a block list with run-length style grouping. Empty → nothing.                                               |
| `\list{id}[bullet=env, numbered=env, plain=env]` | Same, with custom LaTeX environment overrides per style.                                                           |
| `\inlinelist{id}{separator}`                     | Render an inline list, joining items with the separator. Empty → nothing.                                          |
| `\begin{group-list}{id}` / `\end{group-list}`    | Iterate over a group list. Pushes a new scope for each instance.                                                   |
| `\begin{if}{id}` / `\end{if}`                    | Render block only if the resolved ID is non-empty (field), has items (list/inline list), or has instances (group). |

### `\list{id}` — Run-Length Grouping

When the engine encounters `\list{id}`, it:

1. Resolves the list from `content.lists` in the current scope.
2. Groups consecutive items by `style` (run-length encoding).
3. Emits each run inside its mapped LaTeX environment.

Default environment mapping (overridable via optional bracket syntax):

| Style      | Default environment           |
| ---------- | ----------------------------- |
| `bullet`   | `itemize`                     |
| `numbered` | `enumerate`                   |
| `plain`    | _(bare text, no environment)_ |

Each numbered run restarts at 1. Plain items emit their content directly (after HTML→LaTeX conversion), separated by newlines — no `\item`, no wrapping environment. Empty lists emit nothing.

Example content:

```json
[
  { "style": "bullet", "text": "First" },
  { "style": "bullet", "text": "Second" },
  { "style": "plain", "text": "<b>Languages:</b> Java, Python" },
  { "style": "numbered", "text": "Step one" },
  { "style": "numbered", "text": "Step two" }
]
```

Generated LaTeX:

```latex
\begin{itemize}
  \item First
  \item Second
\end{itemize}
\textbf{Languages:} Java, Python
\begin{enumerate}
  \item Step one
  \item Step two
\end{enumerate}
```

Custom environments must be defined in the `.cls` file:

```latex
\list{highlights}[bullet=tightitemize, numbered=compactenum, plain=none]
```

### `\inlinelist{id}{separator}` — Join with Separator

When the engine encounters `\inlinelist{id}{sep}`, it:

1. Resolves the inline list from `content.inlineLists` in the current scope.
2. Converts each item from HTML→LaTeX.
3. Joins all items with the separator string.

The separator is inserted between items only (not trailing). Empty inline lists emit nothing. The separator argument is required — use `{}` for no separator.

### Scoping

All commands resolve IDs relative to the nearest enclosing `\begin{group-list}` — no dot notation needed. The engine uses a scope stack: each `\begin{group-list}` pushes, each `\end{group-list}` pops.

**Resolution order** (consistent across `\field`, `\list`, `\inlinelist`, `\begin{group-list}`, and `\begin{if}`): check `scope.fields[id]`, then `scope.groupLists[id]`, then `scope.lists[id]`, then `scope.inlineLists[id]`.

**ID uniqueness:** Within each scope (top-level or inside a `GroupListDef`), all field, list, inline list, and group list IDs must be unique across all four namespaces. Validate on template save — reject duplicates to prevent silent shadowing.

### HTML → LaTeX

`<b>` → `\textbf{}`, `<i>` → `\textit{}`, `<u>` → `\underline{}`, `<a href>` → `\href{}{}`. This is the only transformation — there is no second wrapping pass. The engine does not read `defaultFormat` from the layout.

**Escaping:** Before converting HTML tags, escape all LaTeX special characters (`\`, `%`, `$`, `#`, `&`, `{`, `}`, `~`, `^`, `_`) in text nodes. Without this, user input like `$150k` or `C++ & Go` will break compilation.

### Parsing

Parse the template into an AST of text + command nodes, then walk it with the content. Single pass, no intermediate translation. Validate matching `\begin`/`\end` pairs and report errors with line numbers.

The same parser also drives **spec derivation** (section 5): as it encounters template commands, it accumulates field, list, inline list, and group list definitions into a `TemplateSpec`. This means parsing runs once and produces both the AST (for the templating engine) and the derived spec (for layout sync).

The parser must handle:

- `\field{id}` — single argument
- `\list{id}` — single argument, optional bracket overrides
- `\inlinelist{id}{separator}` — two arguments
- `\begin{group-list}{id}` / `\end{group-list}` — paired
- `\begin{if}{id}` / `\end{if}` — paired

---

## 5. Layout–Spec Sync

The spec is derived from the LaTeX source on every save. The layout references field and list IDs from the derived spec. Since the Layout Editor is deferred, the main risk is LaTeX edits that add/remove fields without the layout updating — the sync process handles this automatically.

### Save pipeline

On every LaTeX save, the following steps run as a **single database transaction**. If any step fails, everything rolls back — the previous LaTeX, spec, and layout are retained.

1. **Parse LaTeX → derive spec.** The parser walks the AST and produces a fresh `TemplateSpec`. This is the same parser described in section 4 (Parsing), extended to accumulate spec entries as it encounters template commands:

   | LaTeX command            | Produces                         |
   | ------------------------ | -------------------------------- |
   | `\field{id}`             | `FieldDef` in current scope      |
   | `\list{id}`              | `ListDef` in current scope       |
   | `\inlinelist{id}{sep}`   | `InlineListDef` in current scope |
   | `\begin{group-list}{id}` | `GroupListDef`, push new scope   |
   | `\end{group-list}`       | Pop scope                        |

   If the same ID appears multiple times within a scope (e.g. `\field{name}` used twice), it produces a single entry. Cross-namespace collisions (a field and a list sharing the same ID within a scope) are a validation error.

2. **Diff spec → update layout.** Compare the new derived spec against the previous derived spec. On **first save** (no previous spec exists), the entire derived spec is treated as "everything added" and a full default layout is auto-generated.

   For subsequent saves:
   - **Field/list added:** Append a default layout node at the end of the relevant scope.
   - **Field/list removed:** Remove from layout. Warn about orphaned content in existing files (don't delete content — the user may re-add the field). Clean up any `_hidden` references to the removed ID across all group list instances.
   - **Type changed** (e.g. `\list` → `\inlinelist`): Migrate the node in layout. Migrate content in existing files (`ListItem[]` → `string[]` by extracting `.text`; reverse seeds `style` from `defaultItemStyle`).

3. **Write LaTeX, derived spec, and updated layout** in the same transaction.

### Validation errors (block save)

- **Parse failure** (malformed LaTeX, unmatched braces): Save is blocked. The previous spec and layout are retained. The user sees the parse error with a line number.
- Same ID used as both `\list` and `\inlinelist` within a scope.
- Unmatched `\begin`/`\end` pairs.

### Warnings (non-blocking)

- Spec field missing from layout (auto-appended, but worth flagging).
- Orphaned content in files for removed fields.

---

## 6. Content Editor

Renders the layout tree as Tiptap nodes: `Row` → flex row, `Field` → atomic rich text (paragraph only), `Decorator` → static text, `List` → vertical block list with per-item style, `InlineList` → horizontal item flow with separators, `GroupList` → recursive instances with drag handles.

### Rich text

All fields and list items use the same rich text editing. Supported marks: bold, italic, underline, hyperlink. Notion-style floating toolbar on selection. Content stored as HTML strings — inline only, no block-level HTML.

### Block lists (type `"list"`)

Block lists render vertically. Each item has its own `style` (plain, bullet, or numbered) stored in the content, giving users per-item control.

**Visual rendering:**

| Style      | Editor appearance                                             |
| ---------- | ------------------------------------------------------------- |
| `plain`    | No marker, normal text                                        |
| `bullet`   | Bullet character (•) prefix                                   |
| `numbered` | Sequential number prefix within each consecutive numbered run |

Numbered display follows the same run-grouping logic as the LaTeX output — each consecutive numbered run starts at 1.

**Keyboard shortcuts:**

| Trigger                   | Condition                                        | Effect                  |
| ------------------------- | ------------------------------------------------ | ----------------------- |
| `- ` (dash + space)       | Typed at position 0 in a list item               | Item becomes `bullet`   |
| `1. ` (one + dot + space) | Typed at position 0 in a list item               | Item becomes `numbered` |
| Backspace                 | Cursor at start of a `bullet` or `numbered` item | Item reverts to `plain` |

For non-empty items, the trigger characters and the following space are consumed and the existing text is preserved — matching Notion behavior.

**New item behavior:** Enter adds an item, Backspace in empty removes (min 1). Cross-item selection + delete merges items. When pressing Enter:

- If inside a run of bullet/numbered items, the new item inherits the preceding item's style.
- If there is no preceding item (first item) or the preceding item is plain, use the list's `defaultItemStyle` from the layout.
- The new item's editor state is seeded with `defaultFormat` from the layout.

### Inline lists (type `"inlinelist"`)

Inline lists render items as a horizontal flow with visual separator hints between them. No per-item style — no bullet/number markers, no `- ` or `1. ` shortcuts (suppressed entirely).

Enter creates a new item. Backspace in an empty item removes it (min 1 item). New items are seeded with `defaultFormat` from the layout.

Separate Tiptap extension from block lists — different node structure, input rules, and node views.

### Group lists

Drag handles + `+` button on hover. Drag to reorder. Each instance contains its own layout of rows, lists, inline lists, and nested group lists.

### Hidden fields

Fields and lists marked `hideable` in the layout can be collapsed within individual group list instances to reduce editor clutter. Hiding is per-instance — the same field can be hidden in one entry and visible in another.

**Behavior in content mode:** Hidden fields simply disappear from the instance — no chips, no placeholder, no affordance. Non-hideable fields and fields with non-empty content are always visible. The `_hidden` invariant (see section 2) guarantees that hiding never conceals data: if a user types into a hidden field via some other path (e.g. AI tailoring populates it), the guard auto-removes the ID from `_hidden` and the field reappears.

**Revealing hidden fields:** In the layout editor (section 10), selecting a hideable field shows a "Hide" / "Show" toggle. Hide is only available when the field is empty (invariant enforced). Both hiding and revealing happen through the layout editor.

**New instance inheritance:** When a new group list instance is created via the `+` button, it inherits `_hidden` from the preceding sibling (or first sibling if inserting at position 0). Since new instances start with all fields empty, the inherited set always satisfies the invariant.

### Standalone fields

Fixed position, determined by layout. No add/remove/reorder.

---

## 7. LaTeX Editor

Monaco with custom highlighting for the template commands: `\field`, `\list`, `\inlinelist`, `\begin{group-list}`, `\end{group-list}`, `\begin{if}`, `\end{if}`. Autocomplete suggests field/list/inline list/group IDs from the spec (flat list is fine for v1; scope-aware later).

**Template forking:** Edits affect all files using the template. To change it for one file only, fork it into a new template.

**On save:** Run the save pipeline (section 5): parse LaTeX → derive spec → diff → update layout → write all in one transaction. Errors block save with line numbers; warnings are non-blocking.

---

## 8. AI Tailoring

Per-application. Operates on content, not the template. User pastes a job description → AI creates a new version of the file, tailored to the job.

**What changes:** Cover letter body paragraphs. Resume highlights, ordering, and tags. Structural fields (title, dates, location) are untouched.

**Process:** Select most relevant previous application → clone its content into a new version → AI edits the structured JSON → validate against template → save as active version.

**Guardrails:** AI must return valid `FileContent` or the operation fails entirely. The AI prompt explicitly marks read-only vs. editable fields. User can always delete the tailored version to revert. After AI edits, the `_hidden` invariant guard runs on every group list instance — if the AI populated a previously hidden field, it auto-reveals.

---

## 9. Data Model

```
Application
├── metadata (company, position, date, email, phone, jobDescription)
├── files[]
│   ├── File (resume)
│   │   ├── templateId → Template
│   │   ├── versions[] → FileVersion[]
│   │   └── activeVersionId
│   └── File (cover letter)
│       └── ...
└── artifacts[] (rendered PDFs)

Template
├── id, name, type ("resume" | "coverLetter")
├── latex (raw LaTeX source)
├── spec (TemplateSpec — derived from latex on save, cached)
└── layout (TemplateLayout — editor arrangement of spec fields)
```

Template `type` is soft-enforced — the UI warns on mismatch but doesn't block.

A global **user profile** exists but isn't referenced by content or metadata. Used by AI tailoring for context and to pre-fill new applications.

---

## 10. Layout Editor (Deferred)

> The layout spec is fully defined. The visual editor is deferred.

Until then, template creators edit the layout JSON directly or rely on auto-generated layouts from the sync process.

When built, the Layout Editor will support: drag-and-drop reordering, inline placeholder editing, decorator management, `font` / `size` / `background` configuration, `defaultFormat` toggles ("**B** _I_ U"), `defaultItemStyle` picker for block lists (plain/bullet/numbered), fill/hug enforcement, List vs. InlineList type switching, and `hideable` toggling with per-instance "Hide" / "Show" controls (hide only available when the field is empty). It modifies only the `layout` column — field/list/inline list/group list definitions in the spec are owned by the LaTeX Editor.

---
