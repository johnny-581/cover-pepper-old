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

### Template Schema

```typescript
type TemplateSchema = {
  fields: FieldDef[];
  lists: ListDef[];
  groups: GroupDef[];
  layout: LayoutRow[];
};

type FieldDef = { id: string; optional?: boolean };
type ListDef = { id: string; itemId: string };
type GroupDef = {
  id: string;
  fields: FieldDef[];
  lists: ListDef[];
  groups: GroupDef[];
};
```

### Layout

```typescript
type LayoutRow = FieldRow | GroupSection;
type FieldRow = { type: "fieldRow"; blocks: LayoutBlock[] };
type GroupSection = {
  type: "groupSection";
  groupId: string;
  layout: LayoutRow[];
};

type LayoutBlock = FieldBlock | DecoratorBlock;
type DecoratorBlock = { type: "decorator"; text: string };

type FieldBlock = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  style: BlockStyle; // how the field looks in the editor
  outputStyle: OutputStyle; // how the field renders in the PDF
};

type BlockStyle = {
  font:
    | "sans-lg"
    | "sans-md"
    | "sans-sm"
    | "serif-lg"
    | "serif-md"
    | "serif-sm";
  background: "none" | "grey" | "yellow";
  display: "normal" | "bulleted";
};

type OutputStyle = { bold: boolean; italic: boolean; underline: boolean };
```

### File Content

Content is split into `fields`, `lists`, and `groups` so it's self-describing — no schema needed to interpret it.

```typescript
type FileContent = {
  fields: Record<string, string>; // richtext HTML
  lists: Record<string, string[]>; // richtext HTML
  groups: Record<string, GroupInstance[]>;
};

type GroupInstance = {
  _key: string; // nanoid(8)
  fields: Record<string, string>;
  lists: Record<string, string[]>;
  groups: Record<string, GroupInstance[]>;
};
```

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

## 3. Output Styling

`outputStyle` on a `FieldBlock` controls how that field renders in the PDF. It wraps the field's entire rendered content in `\textbf{}`, `\textit{}`, and/or `\underline{}`.

**Render order:** First, convert the field's richtext HTML to LaTeX (`<b>` → `\textbf{}`, etc.). Then wrap the result with any `outputStyle` flags. Nested bold in LaTeX is harmless — it collapses.

**Key rule:** The LaTeX template body should never wrap `\field{}` in `\textbf{}` or `\textit{}` directly. That's `outputStyle`'s job. LaTeX class commands (`\entry`, `\section`) can still define structural styling, but shouldn't apply inline styles to their arguments.

**In the editor:** `outputStyle` is reflected as base CSS on the field. If `outputStyle.bold` is true, the field text appears bold and the toolbar shows "B" as active. Users can still apply additional inline formatting on top.

> Configuring `outputStyle` is deferred to the Layout Editor. Until then, values are set in the template JSON.

---

## 4. Templating Engine

Takes a LaTeX template + `FileContent` → final LaTeX string.

### Commands

| Command                           | What it does                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `\field{id}`                      | Insert field value. Inside an `each` over a plain list, the list's `itemId` resolves to the current item. Empty → empty string. |
| `\begin{each}{id}` / `\end{each}` | Iterate over a list or group array.                                                                                             |
| `\begin{if}{id}` / `\end{if}`     | Render block only if the resolved ID is non-empty (field), has items (list), or has instances (group).                          |

### Scoping

All commands resolve IDs relative to the nearest enclosing `\begin{each}` — no dot notation needed. The engine uses a scope stack: each `\begin{each}` pushes, each `\end{each}` pops.

**Resolution order** (consistent across `\field`, `\begin{each}`, and `\begin{if}`): check `scope.fields[id]`, then `scope.groups[id]`, then `scope.lists[id]`.

**ID uniqueness:** Within each scope (top-level or inside a `GroupDef`), all field, list, and group IDs must be unique across all three namespaces. Validate on template save — reject duplicates to prevent silent shadowing.

### HTML → LaTeX

`<b>` → `\textbf{}`, `<i>` → `\textit{}`, `<u>` → `\underline{}`, `<a href>` → `\href{}{}`. Applied before `outputStyle` wrapping.

**Escaping:** Before converting HTML tags, escape all LaTeX special characters (`\`, `%`, `$`, `#`, `&`, `{`, `}`, `~`, `^`, `_`) in text nodes. Without this, user input like `$150k` or `C++ & Go` will break compilation.

### Parsing

Parse the template into an AST of text + command nodes, then walk it with the content. Single pass, no intermediate translation. Validate matching `\begin`/`\end` pairs and report errors with line numbers.

---

## 5. Layout–Schema Sync

The layout references field IDs from the schema. Since the Layout Editor is deferred, the main risk is LaTeX edits that add/remove fields without updating the layout.

**On template save**, run a validator that checks every `fieldId` and `groupId` in the layout exists in the schema, and every schema field appears in the layout (warning if missing).

**Field added in LaTeX:** Auto-add to schema + append a default `FieldBlock` at the end of the relevant layout scope.

**Field removed from LaTeX:** Remove from schema + layout. Warn about orphaned content (don't delete it — user may re-add the field).

---

## 6. Content Editor

Renders the layout as a tree of React components: `FieldRow` → flex row, `FieldBlock` → inline rich text editor (Tiptap or similar), `DecoratorBlock` → static text, `GroupSection` → recursive with drag handles.

**Rich text:** All fields use the same editor component. Supported marks: bold, italic, underline, hyperlink. Notion-style floating toolbar on selection. Content stored as HTML strings — inline only, no block-level HTML.

**Lists of fields** (e.g. bullets): Enter adds, Backspace in empty removes (min 1). Cross-item selection + delete merges items.

**Lists of groups** (e.g. job entries): Drag handles + `+` button on hover. Drag to reorder.

**Standalone fields:** Fixed position, determined by layout. No add/remove/reorder.

---

## 7. LaTeX Editor

Monaco with custom highlighting for the four pseudo-commands. Autocomplete suggests field/list/group IDs from the schema (flat list is fine for v1; scope-aware later).

**Template forking:** Edits affect all files using the template. To change it for one file only, fork it into a new template.

**On save:** Parse LaTeX → diff against schema → run sync (section 4) → validate layout. Errors block save; warnings are non-blocking.

---

## 8. AI Tailoring

Per-application. Operates on content, not the template. User pastes a job description → AI creates a new version of the file, tailored to the job.

**What changes:** Cover letter body paragraphs. Resume highlights, ordering, and tags. Structural fields (title, dates, location) are untouched.

**Process:** Select most relevant previous application → clone its content into a new version → AI edits the structured JSON → validate against schema → save as active version.

**Guardrails:** AI must return valid `FileContent` or the operation fails entirely. The AI prompt explicitly marks read-only vs. editable fields. User can always delete the tailored version to revert.

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
├── id, type ("resume" | "coverLetter")
├── latex (template source)
└── schema (TemplateSchema)
```

Template `type` is soft-enforced — the UI warns on mismatch but doesn't block.

A global **user profile** exists but isn't referenced by content or metadata. Used by AI tailoring for context and to pre-fill new applications.

---

## 10. Layout Editor (Deferred)

> The layout schema is fully specified. The visual editor is deferred.

Until then, template creators edit the layout JSON directly or rely on auto-generated layouts from the sync process.

When built, the Layout Editor will support: drag-and-drop reordering, inline placeholder editing, decorator management, `BlockStyle` configuration, `OutputStyle` toggles ("PDF: **B** _I_ U"), and fill/hug enforcement. It modifies only the `layout` property — field/list/group definitions are owned by the LaTeX Editor.

---
