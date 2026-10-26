import { toSentenceCase } from "@/lib/display-text";

/**
 * The line name is the book. Older carts stored the world in `title`
 * and the book in `subtitle`. A row that already stores the book as
 * `title` (subtitle empty or the same words) keeps that title.
 */
export function cartLineTitle(item: {
  title: string;
  subtitle?: string | null;
}): string {
  const title = item.title.trim();
  const subtitle = item.subtitle?.trim() ?? "";
  if (
    subtitle &&
    subtitle.localeCompare(title, undefined, { sensitivity: "accent" }) !== 0
  ) {
    return toSentenceCase(subtitle);
  }
  return toSentenceCase(title || subtitle);
}

/** Header badge and drawer both count lines, not units. */
export function cartLineCount(items: readonly unknown[]): number {
  return items.length;
}
