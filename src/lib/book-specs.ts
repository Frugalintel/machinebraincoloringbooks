import type { DatabaseBookSpecs, Product } from "@/lib/types";

export type BookSpecs = Pick<
  Product,
  "pages" | "sides" | "trim" | "binding" | "detail" | "lines"
>;

export const BOOK_SPEC_KEYS = [
  "pages",
  "sides",
  "trim",
  "binding",
  "detail",
  "lines",
] as const satisfies readonly (keyof DatabaseBookSpecs)[];

function positiveNumber(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Rows read before the spec migration simply have none of these keys. */
export function readBookSpecs(row: DatabaseBookSpecs): BookSpecs {
  const pages = positiveNumber(row.pages);
  const detail = positiveNumber(row.detail);
  const specs: BookSpecs = {
    pages: pages === undefined ? undefined : Math.round(pages),
    sides: text(row.sides),
    trim: text(row.trim),
    binding: text(row.binding),
    detail: detail === undefined ? undefined : Math.round(detail),
    lines: text(row.lines),
  };
  return Object.fromEntries(
    Object.entries(specs).filter(([, value]) => value !== undefined),
  ) as BookSpecs;
}

/** Cover aspect follows the trim. 720 / 932 is the lettered frame. */
export const DEFAULT_COVER_ASPECT = 720 / 932;

const TRIM_SIZE = /(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)/;

/** "8.5 × 11 in", "8 × 10 in" and "8 x 10" all set the frame. */
export function coverAspect(specs: Pick<Product, "trim">): number {
  const match = specs.trim?.match(TRIM_SIZE);
  if (!match) return DEFAULT_COVER_ASPECT;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? width / height : DEFAULT_COVER_ASPECT;
}
