export const fontClasses: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
};

export const sizeClasses: Record<string, string> = {
  small: "text-sm",
  normal: "text-base",
  heading: "text-3xl mt-4 mb-2",
};

export const bgClasses: Record<string, string> = {
  none: "",
  grey: "bg-muted",
  yellow: "bg-primary text-primary-foreground",
};

/** Shared padding applied to all editable node wrappers (field, listItem, inlineListItem). */
export const NODE_PADDING = "px-1.5 py-[0.05rem]";

/**
 * Maps common node attributes (font, size, background) to
 * Tailwind class strings. Pass the result into `cn()`.
 */
export function nodeAttrClasses(attrs: {
  font?: unknown;
  size?: unknown;
  background?: unknown;
}): string[] {
  return [
    fontClasses[(attrs.font as string) ?? "sans"] ?? "",
    sizeClasses[(attrs.size as string) ?? "normal"] ?? "",
    bgClasses[(attrs.background as string) ?? "none"] ?? "",
  ];
}
