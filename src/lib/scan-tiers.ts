/**
 * Trophy-tier thresholds for one book of N plates.
 * Lifetime book points never go down. Max is 2N (code + verified photo).
 */

/** Open naming question: keep this label in one place. */
export const TIER_NAME_RARE = "Rare" as const;

export const TIER_NAME_BASIC = "Basic" as const;
export const TIER_NAME_PRO = "Pro" as const;
export const TIER_NAME_LEGENDARY = "Legendary" as const;

export type ThresholdTierName =
  | typeof TIER_NAME_BASIC
  | typeof TIER_NAME_PRO
  | typeof TIER_NAME_RARE;

export type TrophyTierName = ThresholdTierName | typeof TIER_NAME_LEGENDARY;

export type TierThreshold = {
  name: ThresholdTierName;
  points: number;
};

export const PRO_PHOTO_SHARE = 0.125;
export const RARE_PHOTO_SHARE = 0.375;

export function maxBookPoints(pageCount: number): number {
  return 2 * pageCount;
}

export function legendaryFoundRange(pageCount: number): {
  min: number;
  max: number;
} {
  return { min: 2, max: maxBookPoints(pageCount) };
}

/** Basic = N, Pro = N + ceil(N/8), Rare = N + ceil(3N/8). */
export function tiers(pageCount: number): readonly TierThreshold[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new RangeError("pageCount must be a positive integer");
  }
  return [
    { name: TIER_NAME_BASIC, points: pageCount },
    {
      name: TIER_NAME_PRO,
      points: pageCount + Math.ceil(pageCount * PRO_PHOTO_SHARE),
    },
    {
      name: TIER_NAME_RARE,
      points: pageCount + Math.ceil(pageCount * RARE_PHOTO_SHARE),
    },
  ];
}

export function tierOf(
  bookPoints: number,
  pageCount: number,
  legendary = false,
): TrophyTierName | "No tier yet" {
  if (legendary) return TIER_NAME_LEGENDARY;
  const reached = tiers(pageCount).filter((tier) => bookPoints >= tier.points);
  return reached.at(-1)?.name ?? "No tier yet";
}

export function nextTierCopy(
  bookPoints: number,
  pageCount: number,
  options: { allCodesIn?: boolean; pending?: number; legendary?: boolean } = {},
): string {
  if (options.legendary) {
    return `Includes ${TIER_NAME_BASIC}, ${TIER_NAME_PRO} and ${TIER_NAME_RARE}`;
  }
  for (const tier of tiers(pageCount)) {
    if (bookPoints < tier.points) {
      const remain = tier.points - bookPoints;
      const unit = options.allCodesIn
        ? remain === 1
          ? "photo"
          : "photos"
        : remain === 1
          ? "pt"
          : "pts";
      const pending =
        options.pending && options.pending > 0
          ? ` · ${options.pending} pending`
          : "";
      return `${tier.name} in ${remain} more ${unit}${pending}`;
    }
  }
  return `${TIER_NAME_RARE} reached · ${TIER_NAME_LEGENDARY} is a hidden page`;
}

export function ladderProgress(bookPoints: number, pageCount: number): number {
  const max = maxBookPoints(pageCount);
  if (max <= 0) return 0;
  return Math.min(100, (bookPoints / max) * 100);
}
