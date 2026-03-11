# List Redesign Plan

## Goal

Move list item styling (bullet/numbered/plain) from the template layout into content, giving users per-item control with Notion-like shortcuts. Split lists into two fully separate types — List (block) and InlineList — at every level: spec, content, layout, and editor. Replace `\begin{each}` and manual `\begin{itemize}` boilerplate with `\list{id}` and `\inlinelist{id}{separator}` commands.

---

## 1. Content Representation

List and InlineList are fully separate types with different content shapes.

### Before

```typescript
lists: Record<string, string[]>; // richtext HTML (used for both block and inline lists)
```

### After

```typescript
type ListItemStyle = "plain" | "bullet" | "numbered";

type ListItem = {
  style: ListItemStyle;
  text: string; // richtext HTML
};

type FileContent = {
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;           // block lists — per-item style
  inlineLists: Record<string, string[]>;       // inline lists — plain strings
  groupLists: Record<string, GroupListInstance[]>;
};

type GroupListInstance = {
  _key: string;            // nanoid(8)
  _hidden?: string[];      // IDs of fields/lists collapsed in the editor — undefined when nothing hidden
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};
```

This applies at every level — top-level `FileContent` and nested `GroupListInstance`.

### Migration

Existing lists are split into `lists` or `inlineLists` based on their template usage (`\list` vs `\inlinelist`).

Block list items are converted based on the layout's current `display` value:

- `display: "bulleted"` → `{ style: "bullet", text: "..." }`
- `display: "plain"` → `{ style: "plain", text: "..." }`

Inline list items stay as plain strings.

Additionally, enforced `outputStyle` from `itemStyle` is baked into each item's text as part of the Layout Type Redesign migration (e.g. if `itemStyle.outputStyle.bold` was true, each item's text is wrapped in `<b>...</b>`).

---

## 2. Layout Changes

### Replace single `List` type with `List` and `InlineList`

The current `List` type handles both block and inline lists. Split into two separate layout types with different properties.

### Before

```typescript
type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  display: "plain" | "bulleted";
  itemStyle: ItemStyle;
};
```

### After

```typescript
type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional, see Layout Type Redesign for defaults)
  hideable?: boolean;
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  // Seed values for new items (all optional)
  defaultFormat?: DefaultFormat;
  defaultItemStyle?: ListItemStyle;    // default: "plain"
};

type InlineList = {
  type: "inlinelist";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional, see Layout Type Redesign for defaults)
  hideable?: boolean;
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  // Seed formatting for new items
  defaultFormat?: DefaultFormat;
};
```

`InlineList` has no `defaultItemStyle` — per-item style is not applicable for inline rendering.

`defaultItemStyle` on `List` is used when the user presses Enter to create a new item — the new item inherits this style. It has no effect on rendering; only the item's own `style` field matters. Defaults to `"plain"` when omitted.

`hideable` allows the field to be collapsed when empty in group list instances. See the **Layout Type Redesign Plan** for the full type definitions and default values.

---

## 3. LaTeX Template Command

### New command: `\list{id}`

`\begin{each}{id}` is removed entirely. Lists use `\list{id}` (block) or `\inlinelist{id}{separator}` (inline), and group lists use `\begin{group-list}{id}` (a rename to clarify intent — same iteration semantics, but only valid for group lists).

```latex
% Before
\begin{if}{highlights}
\begin{itemize}
\begin{each}{highlights}
  \item \field{highlight}
\end{each}
\end{itemize}
\end{if}

% After
\list{highlights}
```

`\list{id}` is a single command with no closing pair. The engine resolves it entirely from the content data.

### Environment mapping (optional overrides)

Template authors can specify custom LaTeX environments per style:

```latex
\list{highlights}[bullet=tightitemize, numbered=compactenum, plain=none]
```

Defaults when no options are given:

| Style      | Default environment |
|------------|---------------------|
| `bullet`   | `itemize`           |
| `numbered` | `enumerate`         |
| `plain`    | _(bare text, no environment)_ |

The custom environments must be defined in the `.cls` file. Example:

```latex
\newenvironment{tightitemize}{
  \begin{itemize}[leftmargin=1em, itemsep=1pt, label=\textendash]
}{\end{itemize}}
```

### New command: `\inlinelist{id}{separator}`

For lists rendered inline (e.g. contact info, project links), where items are joined by a separator rather than rendered as block-level environments.

```latex
% Before
\contact{\begin{each}{contacts}\field{contact}\end{each}}

% After
\contact{\inlinelist{contacts}{ | }}
```

The engine emits each item's content with the separator inserted between items only (not trailing). Inline list content is plain strings — no per-item style metadata.

Another example — project links with `\quad` spacing:

```latex
% Template
\textbf{\field{entryTitle}} \quad \textit{\inlinelist{tags}{, }}
\quad \inlinelist{links}{\quad}
\hfill \textit{\field{startDate} -- \field{endDate}}
```

Output:

```latex
\textbf{wisk} \quad \textit{Pipecat, SQLite, FastAPI, Next.js}
\quad \href{https://devpost.com/...}{Devpost}\quad\href{https://...}{Visit the app}
\hfill \textit{Jan -- Feb 2026}
```

`\inlinelist` is a single command with no closing pair, like `\list`. The separator argument is required — use `{}` for no separator.

---

## 4. Templating Engine: List Rendering

The engine ignores `_hidden` — all content renders regardless of editor visibility.

### `\list{id}` — Run-Length Grouping

When the engine encounters `\list{id}`, it:

1. Resolves the list from `content.lists` in the current scope.
2. Groups consecutive items by `style` (run-length encoding).
3. Emits each run inside its mapped environment.

### Example

Content:

```json
[
  { "style": "bullet", "text": "First" },
  { "style": "bullet", "text": "Second" },
  { "style": "plain",  "text": "<b>Languages:</b> Java, Python" },
  { "style": "numbered", "text": "Step one" },
  { "style": "numbered", "text": "Step two" }
]
```

Generated LaTeX (with default environments):

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

### Rules

- Each numbered run restarts at 1.
- Plain items emit their content directly (after HTML→LaTeX conversion), separated by newlines. No `\item`, no wrapping environment.
- Empty lists emit nothing.
- HTML→LaTeX conversion is the only transformation. There is no `outputStyle` wrapping — formatting lives entirely in the content HTML (see Layout Type Redesign Plan).

### `\inlinelist{id}{separator}` — Join with Separator

When the engine encounters `\inlinelist{id}{sep}`, it:

1. Resolves the inline list from `content.inlineLists` in the current scope.
2. Converts each item from HTML→LaTeX.
3. Joins all items with the separator string.

Empty inline lists emit nothing.

---

## 5. Content Editor UX

### Block lists (type `"list"`)

#### Keyboard shortcuts

| Trigger | Condition | Effect |
|---------|-----------|--------|
| `- ` (dash + space) | Typed at the start of a list item | Item becomes `bullet` |
| `1. ` (one + dot + space) | Typed at the start of a list item | Item becomes `numbered` |
| Backspace | Cursor at start of a `bullet` or `numbered` item with no text before cursor | Item reverts to `plain` |

"Start of a list item" means position 0 in the item's text. For non-empty items, the trigger characters and the following space are consumed and the existing text is preserved — matching Notion behavior.

#### New item behavior

Pressing Enter to create a new item:

- If inside a run of bullet/numbered items, the new item inherits the preceding item's style.
- If there is no preceding item (first item), or the preceding item is plain, use the list's `defaultItemStyle` from the layout.
- The new item's editor state is seeded with `defaultFormat` from the layout (e.g. bold cursor if `defaultFormat.bold` is true).

#### Visual rendering in the editor

| Style | Editor appearance |
|-------|-------------------|
| `plain` | No marker, normal text |
| `bullet` | Bullet character (•) prefix |
| `numbered` | Sequential number prefix within each consecutive numbered run |

Numbered display in the editor follows the same run-grouping logic as the LaTeX output — each consecutive numbered run starts at 1.

#### Hidden lists

A block list marked `hideable` in the layout can be collapsed when empty within a group list instance. When hidden, the list disappears from the editor entirely. If an item is added (e.g. via AI tailoring), the `_hidden` invariant guard auto-reveals the list.

### Inline lists (type `"inlinelist"`)

No style shortcuts (`- `, `1. `) — these are suppressed entirely. No bullet/number markers. Items render as a horizontal flow with visual separator hints between them.

Enter creates a new item. Backspace in an empty item removes it (min 1 item). New items are seeded with `defaultFormat` from the layout.

Separate Tiptap extension from block lists — different node structure, input rules, and node views.

Like block lists, an inline list marked `hideable` can be collapsed when empty within a group list instance.

---

## 6. Spec / Sync Impact

### Spec changes

List and InlineList are separate in the spec. `itemId` is dropped — `\list` and `\inlinelist` render items directly.

```typescript
type TemplateSpec = {
  fields: FieldDef[];
  lists: ListDef[];
  inlineLists: InlineListDef[];
  groupLists: GroupListDef[];
};

type ListDef = { id: string };
type InlineListDef = { id: string };
```

### Sync rules

The template is the source of truth. Sync derives the type from the command used:

- `\list{id}` → add to `spec.lists`, create `List` in layout
- `\inlinelist{id}{sep}` → add to `spec.inlineLists`, create `InlineList` in layout
- Template changes from `\list` to `\inlinelist` → migrate between namespaces in spec, content, and layout. Content migrates from `ListItem[]` to `string[]` by extracting `.text` (style is discarded). Reverse direction seeds `style` from `defaultItemStyle`.
- List ID referenced by both `\list` and `\inlinelist` → sync error
- `\begin{each}` usage → sync error (removed command)
- Field removed from LaTeX → remove from spec + layout. Also clean up any `_hidden` references to the removed ID across all group list instances.

The sync validator should recognize `\list{id}` and `\inlinelist{id}{sep}` as list references when checking for orphaned IDs.

---

## 7. Implementation Order

1. **Types** — Add `ListItem`, `ListItemStyle`, `ListDef`, `InlineListDef`. Add `List` and `InlineList` layout types using the flattened primitives from the Layout Type Redesign (including `hideable`). Update `FileContent` and `GroupListInstance` with separate `lists` and `inlineLists` namespaces, and add `_hidden?: string[]` to `GroupListInstance`.
2. **Migration** — Split existing lists into `lists` or `inlineLists` based on template usage. Convert block list items from strings to `ListItem` objects (reading `display` from layout for initial style). Bake enforced `outputStyle` into item text as HTML tags.
3. **Content editor** — Implement block list Tiptap extension (per-item style rendering, `- ` / `1. ` shortcuts, new-item inheritance, `defaultFormat` seeding). Implement inline list Tiptap extension (item add/remove, separator display, `defaultFormat` seeding, no style shortcuts). Implement hidden field logic: filter out `_hidden` IDs when rendering group list instances, run invariant guard after every content mutation.
4. **Templating engine** — Implement `\list{id}` parsing (run-length grouping, environment mapping) and `\inlinelist{id}{separator}` parsing (join with separator). Resolve `\list` from `content.lists` and `\inlinelist` from `content.inlineLists`. Engine ignores `_hidden`.
5. **Template updates** — Convert block lists from `\begin{each}` + `\begin{itemize}` to `\list`. Convert inline lists from `\begin{each}` to `\inlinelist`. Rename remaining `\begin{each}` (group list iteration) to `\begin{group-list}`. Remove `\begin{each}` from the engine parser entirely.