export const fontClasses: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
};

export const sizeClasses: Record<string, string> = {
  small: "text-sm",
  normal: "text-base",
  heading: "text-2xl",
};

export const bgClasses: Record<string, string> = {
  none: "",
  grey: "bg-muted",
  yellow: "bg-cream dark:bg-cream-dim",
};

/** Shared padding applied to all editable node wrappers (field, listItem, inlineListItem). */
export const NODE_PADDING = "px-1.5 py-[0.05rem]";

export type BaseFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

/**
 * Maps common node attributes (font, size, background, defaultFormat) to
 * Tailwind class strings. Pass the result into `cn()`.
 */
export function nodeAttrClasses(attrs: {
  font?: unknown;
  size?: unknown;
  background?: unknown;
  defaultFormat?: unknown;
}): string[] {
  const baseFormat = (attrs.defaultFormat ?? {}) as BaseFormat;
  return [
    fontClasses[(attrs.font as string) ?? "sans"] ?? "",
    sizeClasses[(attrs.size as string) ?? "normal"] ?? "",
    bgClasses[(attrs.background as string) ?? "none"] ?? "",
    baseFormat.bold ? "font-bold" : "",
    baseFormat.italic ? "italic" : "",
    baseFormat.underline ? "underline" : "",
  ];
}
