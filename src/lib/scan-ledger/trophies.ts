import {
  TIER_NAME_BASIC,
  TIER_NAME_LEGENDARY,
  TIER_NAME_PRO,
  TIER_NAME_RARE,
  type TrophyTierName,
} from "@/lib/scan-tiers";

/**
 * Example Ferris-wheel trophies only. Placeholder art for /scan review,
 * not the production per-book trophies.
 */
export const TIER_TROPHY_MODELS = {
  [TIER_NAME_BASIC]: "/models/ferris-wheel-basic.v1.glb",
  [TIER_NAME_PRO]: "/models/ferris-wheel-pro.v1.glb",
  [TIER_NAME_RARE]: "/models/ferris-wheel-rare.v1.glb",
  [TIER_NAME_LEGENDARY]: "/models/ferris-wheel-legendary.v1.glb",
} as const;

export const TIER_TROPHY_POSTERS = {
  [TIER_NAME_BASIC]: "/models/ferris-wheel-basic.webp",
  [TIER_NAME_PRO]: "/models/ferris-wheel-pro.webp",
  [TIER_NAME_RARE]: "/models/ferris-wheel-rare.webp",
  [TIER_NAME_LEGENDARY]: "/models/ferris-wheel-legendary.webp",
} as const;

export function tierTrophyUrl(
  tier: TrophyTierName | "No tier yet",
): string | null {
  if (tier === "No tier yet") return null;
  return TIER_TROPHY_MODELS[tier];
}

export function tierTrophyPosterUrl(
  tier: TrophyTierName | "No tier yet",
): string | null {
  if (tier === "No tier yet") return null;
  return TIER_TROPHY_POSTERS[tier];
}

export function legendaryCaption(foundAt: number | null, _max: number): string {
  if (foundAt == null) return "LEGENDARY · NOT FOUND";
  return `LEGENDARY · FOUND AT ${foundAt} PTS`;
}

export function legendaryRarityNote(max: number): string {
  return `LOWER IS RARER · 2 TO ${max}`;
}
