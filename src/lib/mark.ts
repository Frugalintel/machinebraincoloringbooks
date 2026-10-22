/**
 * Machine Brain mark-v6 (V5 line brain) asset rules.
 *
 * Full mark only, at rendered size ≥ 48 CSS px. The small-cut files are
 * pending a Studio rebuild — do not ship S3/S4 assets from this pass.
 */

export const FULL_MARK_MIN_PX = 48;

/** mark-v6 viewBox is 1000×1000. Each corner registration arm is 150 units. */
export const MARK_VIEWBOX_PX = 1000;
export const MARK_CORNER_ARM_UNITS = 150;

/** Clear space around the mark = one corner arm, as a fraction of mark size. */
export const MARK_CORNER_ARM_RATIO = MARK_CORNER_ARM_UNITS / MARK_VIEWBOX_PX;

export type MarkInk = "cream" | "ink";
export type MarkCut = "full" | "small";

export type MarkAsset = {
  cut: "full";
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
 * < 48 px → null. Callers must keep the existing wordmark-only treatment.
 *
 * TODO(F3-small): when Studio delivers the rebuilt small cut, return that
 * asset here (hand-fitted 16/24/32, vector master for other sizes < 48).
 */
export function resolveMarkAsset(
  sizePx: number,
  ink: MarkInk = "cream",
): MarkAsset | null {
  const resolvedInk = assertMarkInk(ink);

  if (!Number.isFinite(sizePx) || sizePx < FULL_MARK_MIN_PX) {
    return null;
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
