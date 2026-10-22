/**
 * Machine Brain mark-v6 (V5 line brain) asset rules.
 *
 * Full mark-v6 at rendered size ≥ 48 CSS px. S3 "Terminal clean" SVG
 * below 48 px. Single ink only: cream on dark, ink on light.
 */

export const FULL_MARK_MIN_PX = 48;

/** Header lockup: S3 small cut on viewports below `lg`. */
export const HEADER_MARK_SIZE_MOBILE_PX = 32;
/** Header lockup: full mark-v6 from the `lg` breakpoint up. */
export const HEADER_MARK_SIZE_DESKTOP_PX = FULL_MARK_MIN_PX;

/** mark-v6 viewBox is 1000×1000. Each corner registration arm is 150 units. */
export const MARK_VIEWBOX_PX = 1000;
export const MARK_CORNER_ARM_UNITS = 150;

/** Clear space around the mark = one corner arm, as a fraction of mark size. */
export const MARK_CORNER_ARM_RATIO = MARK_CORNER_ARM_UNITS / MARK_VIEWBOX_PX;

export type MarkInk = "cream" | "ink";
export type MarkCut = "full" | "small";

export type MarkAsset = {
  cut: MarkCut;
  ink: MarkInk;
  src: string;
};

function assertMarkInk(ink: MarkInk): MarkInk {
  switch (ink) {
    case "cream":
    case "ink":
      return ink;
    default: {
      const _exhaustive: never = ink;
      throw new Error(`Unhandled mark ink: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Pick the official mark file for a CSS-pixel render size.
 *
 * ≥ 48 px → full mark-v6 SVG in the requested ink.
 * > 0 and < 48 px → S3 small-cut SVG in the requested ink.
 * non-finite / ≤ 0 → null.
 */
export function resolveMarkAsset(
  sizePx: number,
  ink: MarkInk = "cream",
): MarkAsset | null {
  const resolvedInk = assertMarkInk(ink);

  if (!Number.isFinite(sizePx) || sizePx <= 0) {
    return null;
  }

  if (sizePx < FULL_MARK_MIN_PX) {
    return {
      cut: "small",
      ink: resolvedInk,
      src: `/brand/mb-mark-S3-small-${resolvedInk}.svg`,
    };
  }

  return {
    cut: "full",
    ink: resolvedInk,
    src: `/brand/mb-mark-full-${resolvedInk}.svg`,
  };
}

/** Clear space in CSS px for a mark rendered at `sizePx`. */
export function markClearSpacePx(sizePx: number): number {
  return sizePx * MARK_CORNER_ARM_RATIO;
}
