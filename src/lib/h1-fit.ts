/**
 * Shared page-H1 fit.
 *
 * font-size: min(max(32px, <vw>), (100vw - 2*gutter) / longest-line em)
 *
 * `displayEm` is the Redaction advance, the same measure store.ts uses.
 * The 32px floor applies when the design vw is smaller and the line still
 * fits. The gutter cap always wins, so a long line cannot clip the margin.
 */
import type { CSSProperties } from "react";
import { displayEm } from "@/lib/store";

export const H1_FIT_FLOOR_PX = 32;
/** Page display H1s track −0.01em. */
export const PAGE_H1_TRACKING = -0.01;

export function pageH1Em(
  lines: readonly string[],
  tracking = PAGE_H1_TRACKING,
): number {
  let max = 0;
  for (const line of lines) {
    const width = displayEm(line, tracking);
    if (width > max) max = width;
  }
  return max || 1;
}

/** Pixel size of the shared rule at a viewport. */
export function pageH1Px(input: {
  vw: number;
  em: number;
  viewport: number;
  gutter: number;
  floor?: number;
}): number {
  const floor = input.floor ?? H1_FIT_FLOOR_PX;
  const design = (input.vw / 100) * input.viewport;
  const fit = (input.viewport - 2 * input.gutter) / input.em;
  return Math.min(Math.max(floor, design), fit);
}

export function pageH1Style(
  lines: readonly string[],
  tracking = PAGE_H1_TRACKING,
): CSSProperties {
  return { "--h1-em": pageH1Em(lines, tracking) } as CSSProperties;
}
