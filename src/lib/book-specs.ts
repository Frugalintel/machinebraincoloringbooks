import type { DatabaseBookSpecs, Product } from "@/lib/types";

export type BookSpecs = Pick<
  Product,
  | "page_count"
  | "trim_width_in"
  | "trim_height_in"
  | "paper"
  | "binding"
  | "title_lines"
>;

export const BOOK_SPEC_KEYS = [
  "page_count",
  "trim_width_in",
  "trim_height_in",
  "paper",
  "binding",
  "title_lines",
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
  const specs: BookSpecs = {
    page_count: positiveNumber(row.page_count),
    trim_width_in: positiveNumber(row.trim_width_in),
    trim_height_in: positiveNumber(row.trim_height_in),
    paper: text(row.paper),
    binding: text(row.binding),
    title_lines: text(row.title_lines),
  };
  if (specs.page_count !== undefined) {
    specs.page_count = Math.round(specs.page_count);
  }
  return Object.fromEntries(
    Object.entries(specs).filter(([, value]) => value !== undefined),
  ) as BookSpecs;
}

/** Cover aspect follows the trim when both sides are known. */
export const DEFAULT_COVER_ASPECT = 720 / 932;

export function coverAspect(
  specs: Pick<Product, "trim_width_in" | "trim_height_in">,
): number {
  const { trim_width_in: w, trim_height_in: h } = specs;
  return w && h ? w / h : DEFAULT_COVER_ASPECT;
}
