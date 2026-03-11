# Hidden Fields Plan

## Goal

Let users collapse empty fields/lists in group list instances to reduce editor clutter. Hiding is per-instance, inheritable, and self-correcting — it never conceals data.

---

## 1. Layout: `hideable`

`hideable` is an editor presentation concern — it lives on the layout types alongside `placeholder`, `font`, `size`, etc. The spec stays clean (just IDs). No `optional` on spec defs — there's no hard validation that rejects empty fields; `\begin{if}` handles emptiness at render time.

```typescript
type Field = {
  type: "field";
  fieldId: string;
  sizing: "fill" | "hug";
  hideable?: boolean; // can be collapsed when empty
  placeholder?: string;
  font?: FontFamily;
  size?: FontSize;
  background?: Background;
  defaultFormat?: DefaultFormat;
};

// Same hideable? property on List and InlineList
```

---

## 2. Instance: `_hidden`

Per-instance metadata alongside `_key`. Omitted (not `[]`) when nothing is hidden.

```typescript
type GroupListInstance = {
  _key: string;
  _hidden?: string[]; // undefined when nothing hidden
  fields: Record<string, string>;
  lists: Record<string, ListItem[]>;
  inlineLists: Record<string, string[]>;
  groupLists: Record<string, GroupListInstance[]>;
};
```

---

## 3. Invariant

```
_hidden ⊆ { id | layout marks id as hideable AND content is empty }
```

Enforced by a guard after every content mutation:

```typescript
function enforceHidden(instance: GroupListInstance, layout: GroupList) {
  if (!instance._hidden?.length) return;
  const result = instance._hidden.filter(
    (id) => isHideable(layout, id) && isEmpty(instance, id),
  );
  instance._hidden = result.length ? result : undefined;
}
```

This covers two cases: content becoming non-empty (auto-reveal) and `hideable` being removed from a field (stale cleanup).

---

## 4. Initial State

Template `sampleContent` seeds `_hidden` on each group list instance. The template author controls which hideable fields start collapsed.

---

## 5. New Instance Inheritance

New instance inherits `_hidden` from the preceding sibling (or first sibling if inserting at position 0). Empty list falls back to `undefined`. Safe by construction — new instances start with all fields empty.

---

## 6. Editor UX

**Content editor:** Hidden fields simply disappear — no chips, no affordance. Non-hideable and non-empty fields are always visible.

**Layout editor:** Selecting a hideable field shows a "Hide" / "Show" toggle. Hide is only available when the field is empty (invariant enforced). Both hiding and revealing happen here.

---

## 7. Rendering

The templating engine ignores `_hidden` entirely. All content renders regardless of editor visibility. Empty fields are already handled by `\begin{if}`.
