/**
 * Points adapter. Production stories have XP and code unlocks, not point
 * prices. This reads a future price or balance only when that field is
 * actually present, and ignores XP.
 */

export const POINTS_EARN_COPY =
  "A page code is 1 pt. The code with a scan of the colored page is 2.";

export type StoryPointSource = {
  cost_pts?: unknown;
  points_cost?: unknown;
  point_price?: unknown;
};

export type ReaderPointSource = {
  points?: unknown;
  point_balance?: unknown;
};

export type StoryPoints = {
  cost?: number;
  balance?: number;
};

function asPoints(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value);
}

function firstPoints(values: readonly unknown[]): number | undefined {
  for (const value of values) {
    const points = asPoints(value);
    if (points !== undefined) return points;
  }
  return undefined;
}

/** Cost and balance are undefined unless a real points field is present. */
export function getStoryPoints(
  story?: StoryPointSource | null,
  reader?: ReaderPointSource | null,
): StoryPoints {
  return {
    cost: firstPoints([
      story?.cost_pts,
      story?.points_cost,
      story?.point_price,
    ]),
    balance: firstPoints([reader?.points, reader?.point_balance]),
  };
}
