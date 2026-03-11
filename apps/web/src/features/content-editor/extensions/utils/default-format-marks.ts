import type { DefaultFormat } from "@pepper-apply/shared";
import type { Mark, Schema } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

type NormalizedDefaultFormat = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export function normalizeDefaultFormat(
  defaultFormat: unknown,
): NormalizedDefaultFormat {
  const source =
    defaultFormat && typeof defaultFormat === "object"
      ? (defaultFormat as DefaultFormat)
      : undefined;

  return {
    bold: Boolean(source?.bold),
    italic: Boolean(source?.italic),
    underline: Boolean(source?.underline),
  };
}

export function applyStoredMarksFromDefaultFormat(
  tr: Transaction,
  schema: Schema,
  defaultFormat: unknown,
): void {
  const normalized = normalizeDefaultFormat(defaultFormat);
  const marks: Mark[] = [];

  if (normalized.bold && schema.marks.bold) {
    marks.push(schema.marks.bold.create());
  }

  if (normalized.italic && schema.marks.italic) {
    marks.push(schema.marks.italic.create());
  }

  if (normalized.underline && schema.marks.underline) {
    marks.push(schema.marks.underline.create());
  }

  tr.setStoredMarks(marks.length > 0 ? marks : []);
}

export function resolveNearestDefaultFormatFromPos(
  resolvedPos: { depth: number; node: (depth: number) => { attrs?: Record<string, unknown> } },
): unknown {
  for (let depth = resolvedPos.depth; depth >= 0; depth -= 1) {
    const node = resolvedPos.node(depth);
    if (!node || typeof node !== "object") continue;

    const attrs = node.attrs;
    if (!attrs || typeof attrs !== "object") continue;

    if (Object.prototype.hasOwnProperty.call(attrs, "defaultFormat")) {
      return attrs.defaultFormat;
    }
  }

  return undefined;
}
