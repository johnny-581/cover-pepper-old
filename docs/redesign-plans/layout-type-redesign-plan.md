# Layout Type Redesign Plan

## Goal

Simplify layout types by flattening nested style objects, splitting compound tokens into independent axes, unifying Field and List styling, and replacing enforced `outputStyle` with seed-only `defaultFormat`.

---

## 1. Remove Enforced Output Styling

`outputStyle` currently wraps a field's entire content in `\textbf{}` / `\textit{}` / `\underline{}` at render time. This is removed. Formatting lives entirely in the content HTML. The engine only does HTML→LaTeX conversion — no second wrapping pass.

`outputStyle` is replaced by `defaultFormat`, which seeds the editor state when new content is created. It is never read at render time.

**When defaults apply:**

- **New list item** (Enter key): editor activates the formatting marks from `defaultFormat`. User types in bold if `defaultFormat.bold` is true. Can be toggled off via toolbar.
- **New group list instance** (`+` button): each field within it reads its own `defaultFormat` and pre-activates those marks.
- **Empty field reset**: clearing all text and retyping re-applies `defaultFormat`, matching the behavior of `defaultItemStyle` for list items.

---

## 2. Layout Type Changes

### Before

```typescript
type FontToken = "sans-lg" | "sans-md" | "sans-sm"
               | "serif-lg" | "serif-md" | "serif-sm";
type BackgroundToken = "none" | "grey" | "yellow";
type OutputStyle = { bold: boolean; italic: boolean; underline: boolean };

type FieldStyle = { font: FontToken; background: BackgroundToken };
type ItemStyle = { font: FontToken; outputStyle: OutputStyle };

type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  style: FieldStyle;
  outputStyle: OutputStyle;
};

type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  placeholder: string;
  defaultStyle: ListItemStyle;
  itemStyle: ItemStyle;
};
```

### After

```typescript
type FontFamily = "sans" | "serif";
type FontSize = "small" | "normal" | "heading";
type Background = "none" | "grey" | "yellow";
type DefaultFormat = { bold?: boolean; italic?: boolean; underline?: boolean };

type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean;           // default: false — can be collapsed when empty in group list instances
  placeholder?: string;         // default: ""
  font?: FontFamily;            // default: "sans"
  size?: FontSize;              // default: "normal"
  background?: Background;      // default: "none"
  // Seed formatting for new content
  defaultFormat?: DefaultFormat; // default: { bold: false, italic: false, underline: false }
};

type Decorator = { type: "decorator"; text: string };

type List = {
  type: "list";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean;                  // default: false
  placeholder?: string;                // default: ""
  font?: FontFamily;                   // default: "sans"
  size?: FontSize;                     // default: "normal"
  background?: Background;             // default: "none"
  // Seed values for new items
  defaultFormat?: DefaultFormat;        // default: { bold: false, italic: false, underline: false }
  defaultItemStyle?: ListItemStyle;    // default: "plain"
};

type InlineList = {
  type: "inlinelist";
  listId: string;
  sizing: "fill" | "hug";
  // Editor appearance (all optional with defaults)
  hideable?: boolean;                  // default: false
  placeholder?: string;                // default: ""
  font?: FontFamily;                   // default: "sans"
  size?: FontSize;                     // default: "normal"
  background?: Background;             // default: "none"
  // Seed formatting for new items
  defaultFormat?: DefaultFormat;        // default: { bold: false, italic: false, underline: false }
};
```

**Defaults:** only `type`, `fieldId`/`listId`, and `sizing` are required. All other properties fall back to sensible defaults when omitted. `DefaultFormat` inner fields also default to `false` — `{ bold: true }` is equivalent to `{ bold: true, italic: false, underline: false }`.

A minimal field:

```typescript
{ type: "field", fieldId: "location", sizing: "fill" }
```

A bold heading only overrides what's different:

```typescript
{ type: "field", fieldId: "sectionTitle", sizing: "fill", size: "heading", defaultFormat: { bold: true } }
```

### What changed

| Before | After | Why |
|--------|-------|-----|
| `FieldStyle` wrapper | Flattened `font`, `size`, `background` on Field | Removes unnecessary nesting |
| `ItemStyle` wrapper | Same flat properties on List and InlineList | Field, List, and InlineList share the same shape |
| Single `List` type | Separate `List` and `InlineList` | Different editor behavior, different content shapes (see List Redesign Plan) |
| `FontToken` (`"sans-sm"`) | `font: FontFamily` + `size: FontSize` | Independent axes, independently configurable |
| `"lg"` / `"md"` / `"sm"` | `"heading"` / `"normal"` / `"small"` | Names match their semantic meaning |
| `outputStyle` (enforced at render) | `defaultFormat` (seed only) | Formatting now lives in content HTML |
| `ItemStyle.outputStyle` | `List.defaultFormat` / `InlineList.defaultFormat` | Consistent naming with `defaultItemStyle` |
| `background` only on Field | `background` on Field, List, and InlineList | Uniform types, omit if unused |
| All properties required | Most properties optional with defaults | Reduces verbosity for common cases |
| _(no equivalent)_ | `hideable` on Field, List, and InlineList | Allows collapsing empty fields in group list instances |

---

## 3. Row Centering

Auto-inferred from sizing, not stored as a property.

**Rule:** if every block in a row has `sizing: "hug"`, the row centers its contents. If at least one block is `"fill"`, it stretches to absorb remaining space (current behavior).

This means the template author controls centering purely through sizing choices. A name/contacts header where everything is hug will center naturally. No new property to configure.

---

## 4. Engine Simplification

Remove the `outputStyle` wrapping step from the templating engine. The current pipeline:

1. Convert field HTML to LaTeX (`<b>` → `\textbf{}`)
2. Wrap result with `outputStyle` flags

Becomes just step 1. The engine no longer reads `outputStyle` / `defaultFormat` from the layout at all — that's purely an editor concern. Similarly, the engine ignores `hideable` and `_hidden` — all content renders regardless of editor visibility.