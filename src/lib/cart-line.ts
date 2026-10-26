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

/** Header badge counts lines. The drawer sentence counts units. */
export function cartLineCount(items: readonly unknown[]): number {
  return items.length;
}

export function cartUnitCount(items: readonly { quantity?: number }[]): number {
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

export function cartUnitLabel(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}
