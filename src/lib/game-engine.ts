/**
 * GAME ENGINE
 *
 * Core logic for the unified pillar system.
 * Handles XP calculations, gate checking, and pillar score calculations.
 *
 * Design Principle: Each pillar works standalone. Cross-pillar bonuses
 * are "invitations" that enhance but never require engagement.
 */

import type { Achievement } from "./types";
import type { CollectionSet } from "./game-data";
import {
  getAchievementCategoryBonus,
  calculatePenaltyReduction,
  MASTERY_PER_BOOK,
} from "./pillar-rewards";

// ============================================================================
// TYPES
// ============================================================================

export interface XPContext {
  sourceType: "milestone" | "story" | "mastery" | "achievement" | "gate_skip";
  baseXP: number;
  // Book/Story context for penalties
  bookCategory?: string;
  storyCategory?: string;
  isCoreBook?: boolean;
  // Bonus triggers
  hasColoredUpload?: boolean;
  // Cross-pillar state (optional - provides bonuses if present)
  equippedAchievementIds?: string[];
  completedSetIds?: string[];
  achievements?: Achievement[];
}

export interface XPResult {
  finalXP: number;
  rawXP: number;
  multipliers: Record<string, number>;
}

export interface GateRequirement {
  type: "achievement" | "collectible" | "product";
  id: string;
  mode?: "owned" | "equipped"; // For achievements: equipped means in loadout
}

export interface StoryGate {
  storyId: string;
  nodeId: string;
  requirements: GateRequirement[];
  bypassXpCost: number;
  bypassAlternatives?: GateRequirement[];
  isHardGate: boolean;
}

export interface UserState {
  ownedAchievementIds: string[];
  equippedAchievementIds: string[];
  ownedCollectibleIds: string[];
  ownedProductIds: string[];
  totalXP: number;
}

export interface GateCheckResult {
  canPass: boolean;
  hasRequirement: boolean;
  bypassOptions: {
    xpCost?: number;
    alternatives?: GateRequirement[];
    canAffordXP?: boolean;
  };
}

export interface UserAchievementProgress {
  achievementId: string;
  currentValue: number;
  isUnlocked: boolean;
  tierReached: "bronze" | "silver" | "gold" | "platinum";
}

// ============================================================================
// XP CALCULATOR
// ============================================================================

/**
 * Calculate XP with all applicable multipliers.
 *
 * Multipliers are applied in order:
 * 1. Colored upload bonus (+30%)
 * 2. Category penalties (story track only, -25% or -50%)
 * 3. Penalty reduction from completed sets
 * 4. Loadout bonus from equipped achievements (+10% per themed achievement)
 */
export function calculateXP(context: XPContext): XPResult {
  let xp = context.baseXP;
  const multipliers: Record<string, number> = {};

  // 1. Colored Upload Bonus (+30%)
  if (context.hasColoredUpload) {
    multipliers.colored_bonus = 1.3;
    xp *= 1.3;
  }

  // 2. Category Penalties (story track only)
  if (
    context.sourceType === "story" &&
    context.bookCategory &&
    context.storyCategory
  ) {
    if (context.isCoreBook === false) {
      let penalty: number;

      if (context.bookCategory === context.storyCategory) {
        // Non-core, same category: -25%
        penalty = 0.75;
        multipliers.non_core_penalty = penalty;
      } else {
        // Cross-category: -50%
        penalty = 0.5;
        multipliers.cross_category_penalty = penalty;
      }

      // 3. Apply penalty reduction from completed sets
      if (context.completedSetIds && context.completedSetIds.length > 0) {
        const penaltyReduction = calculatePenaltyReduction(
          context.completedSetIds,
        );
        if (penaltyReduction > 0) {
          // Reduce the penalty (e.g., 0.5 penalty with 0.25 reduction becomes 0.625)
          const reducedPenalty = penalty + (1 - penalty) * penaltyReduction;
          multipliers.penalty_reduction = reducedPenalty / penalty;
          penalty = reducedPenalty;
        }
      }

      xp *= penalty;
    }
  }

  // 4. Loadout Bonus (INVITATION from achievements pillar)
  if (context.equippedAchievementIds && context.storyCategory) {
    const loadoutBonus = getAchievementCategoryBonus(
      context.equippedAchievementIds,
      context.storyCategory,
    );
    if (loadoutBonus > 0) {
      multipliers.loadout_bonus = 1 + loadoutBonus;
      xp *= 1 + loadoutBonus;
    }
  }

  return {
    finalXP: Math.round(xp),
    rawXP: context.baseXP,
    multipliers,
  };
}

/**
 * Calculate XP for mastery completion.
 * Mastery XP is fixed (no penalties) but can receive bonuses.
 */
export function calculateMasteryXP(context: {
  hasColoredUpload?: boolean;
  equippedAchievementIds?: string[];
  bookCategory?: string;
}): XPResult {
  return calculateXP({
    sourceType: "mastery",
    baseXP: MASTERY_PER_BOOK.xpBonus,
    hasColoredUpload: context.hasColoredUpload,
    equippedAchievementIds: context.equippedAchievementIds,
    storyCategory: context.bookCategory, // For themed bonus
  });
}

// ============================================================================
// GATE CHECKER (Soft Gates)
// ============================================================================

/**
 * Check if a user can pass through a story gate.
 *
 * Soft gates (default) can always be bypassed via:
 * - Spending XP
 * - Having alternative requirements
 *
 * Hard gates (rare, ~1% of content) cannot be bypassed.
 */
export function checkGate(
  gate: StoryGate,
  userState: UserState,
): GateCheckResult {
  // Check if user has all requirements
  const hasAllRequirements = gate.requirements.every((req) => {
    if (req.type === "achievement") {
      const isOwned = userState.ownedAchievementIds.includes(req.id);
      if (req.mode === "equipped") {
        return userState.equippedAchievementIds.includes(req.id);
      }
      return isOwned;
    }
    if (req.type === "collectible") {
      return userState.ownedCollectibleIds.includes(req.id);
    }
    if (req.type === "product") {
      return userState.ownedProductIds.includes(req.id);
    }
    return false;
  });

  // User has requirements - pass automatically
  if (hasAllRequirements) {
    return { canPass: true, hasRequirement: true, bypassOptions: {} };
  }

  // Check alternatives
  const hasAlternative = gate.bypassAlternatives?.some((alt) => {
    if (alt.type === "achievement") {
      return userState.ownedAchievementIds.includes(alt.id);
    }
    if (alt.type === "collectible") {
      return userState.ownedCollectibleIds.includes(alt.id);
    }
    if (alt.type === "product") {
      return userState.ownedProductIds.includes(alt.id);
    }
    return false;
  });

  if (hasAlternative) {
    return { canPass: true, hasRequirement: true, bypassOptions: {} };
  }

  // Hard gate - no bypass
  if (gate.isHardGate) {
    return {
      canPass: false,
      hasRequirement: false,
      bypassOptions: {},
    };
  }

  // Soft gate - can bypass with XP or alternatives
  return {
    canPass: true,
    hasRequirement: false,
    bypassOptions: {
      xpCost: gate.bypassXpCost,
      alternatives: gate.bypassAlternatives,
      canAffordXP: userState.totalXP >= gate.bypassXpCost,
    },
  };
}

/**
 * Check if user can afford to skip a gate with XP.
 */
export function canAffordGateSkip(gate: StoryGate, userXP: number): boolean {
  return userXP >= gate.bypassXpCost;
}

// ============================================================================
// STRIKE SYSTEM
// ============================================================================

export const STRIKE_COSTS = {
  branch: 500, // Reset last branch
  section: 1000, // Reset to previous section
  start: 1500, // Reset to story start (minor stories only)
} as const;

export type ResetLevel = keyof typeof STRIKE_COSTS;

/**
 * Calculate the XP cost for a story reset.
 * Returns null if reset is not allowed (max strikes reached).
 */
export function calculateResetCost(
  currentStrikes: number,
  resetLevel: ResetLevel,
  isMinorStory: boolean,
): number | null {
  // Max 3 strikes
  if (currentStrikes >= 3) return null;

  // Full reset only allowed for minor stories
  if (resetLevel === "start" && !isMinorStory) return null;

  return STRIKE_COSTS[resetLevel];
}

/**
 * Check if user can afford a story reset.
 */
export function canAffordReset(
  userXP: number,
  currentStrikes: number,
  resetLevel: ResetLevel,
  isMinorStory: boolean,
): boolean {
  const cost = calculateResetCost(currentStrikes, resetLevel, isMinorStory);
  return cost !== null && userXP >= cost;
}

// ============================================================================
// PILLAR SCORE CALCULATORS (Standalone progression)
// ============================================================================

/**
 * Calculate collector score based on collectibles owned.
 * This is a standalone metric - no XP dependency.
 */
export function calculateCollectorScore(
  userCollectibleIds: string[],
  sets: CollectionSet[],
): number {
  // Base: 10 points per collectible
  let score = userCollectibleIds.length * 10;

  // Bonus: 100 points per completed set
  sets.forEach((set) => {
    const collectedCount = set.items.filter((item) =>
      userCollectibleIds.includes(item.id),
    ).length;

    if (collectedCount === set.total) {
      score += 100;
    }
  });

  // Bonus: Rarity multiplier
  sets.forEach((set) => {
    set.items.forEach((item) => {
      if (userCollectibleIds.includes(item.id)) {
        const rarityBonus = getRarityBonus(item.rarity);
        score += rarityBonus;
      }
    });
  });

  return score;
}

/**
 * Get rarity bonus points.
 */
function getRarityBonus(rarity: string): number {
  switch (rarity) {
    case "Legendary":
      return 50;
    case "Epic":
      return 30;
    case "Rare":
      return 20;
    case "Uncommon":
      return 10;
    default:
      return 5;
  }
}

/**
 * Calculate achievement score based on achievements earned.
 * This is a standalone metric - no XP dependency.
 */
export function calculateAchievementScore(
  userAchievements: UserAchievementProgress[],
): number {
  const tierMultiplier: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 5,
  };

  return userAchievements.reduce((score, ach) => {
    if (!ach.isUnlocked) return score;
    const multiplier = tierMultiplier[ach.tierReached] || 1;
    return score + 10 * multiplier;
  }, 0);
}

/**
 * Calculate mastery score based on books mastered.
 * This is a standalone metric - no XP dependency.
 */
export function calculateMasteryScore(masteredBookCount: number): number {
  // 100 points per mastered book
  return masteredBookCount * 100;
}

// ============================================================================
// LEVEL CALCULATOR
// ============================================================================

/**
 * XP thresholds for each level.
 * Levels increase exponentially.
 */
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  300, // Level 3
  600, // Level 4
  1000, // Level 5
  1500, // Level 6
  2100, // Level 7
  2800, // Level 8
  3600, // Level 9
  4500, // Level 10
  5500, // Level 11
  6600, // Level 12
  7800, // Level 13
  9100, // Level 14
  10500, // Level 15
  12000, // Level 16
  13600, // Level 17
  15300, // Level 18
  17100, // Level 19
  19000, // Level 20
  // Continue pattern...
];

/**
 * Calculate level from total XP.
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  // Handle XP beyond defined thresholds
  if (level >= LEVEL_THRESHOLDS.length) {
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const xpPerLevel = 2000; // Linear after max defined level
    const extraLevels = Math.floor((totalXP - lastThreshold) / xpPerLevel);
    level = LEVEL_THRESHOLDS.length + extraLevels;
  }
  return level;
}

/**
 * Get XP progress within current level.
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const level = calculateLevel(totalXP);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 2000;

  const currentLevelXP = totalXP - currentThreshold;
  const nextLevelXP = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, (currentLevelXP / nextLevelXP) * 100);

  return {
    currentLevel: level,
    currentLevelXP,
    nextLevelXP,
    progressPercent,
  };
}

// ============================================================================
// SET COMPLETION CHECKER
// ============================================================================

/**
 * Check which sets are complete.
 */
export function getCompletedSets(
  userCollectibleIds: string[],
  sets: CollectionSet[],
): string[] {
  return sets
    .filter((set) => {
      const collectedCount = set.items.filter((item) =>
        userCollectibleIds.includes(item.id),
      ).length;
      return collectedCount === set.total;
    })
    .map((set) => set.id);
}

/**
 * Get set completion progress.
 */
export function getSetProgress(
  userCollectibleIds: string[],
  set: CollectionSet,
): { collected: number; total: number; percent: number; isComplete: boolean } {
  const collected = set.items.filter((item) =>
    userCollectibleIds.includes(item.id),
  ).length;

  return {
    collected,
    total: set.total,
    percent: Math.round((collected / set.total) * 100),
    isComplete: collected === set.total,
  };
}

// ============================================================================
// INVITATION HELPERS
// ============================================================================

/**
 * Generate invitation message for cross-pillar bonus.
 */
export function getInvitationMessage(
  pillar: "collectibles" | "achievements" | "mastery",
  bonusType: string,
  bonusValue: number | string,
): string {
  const messages: Record<string, Record<string, string>> = {
    collectibles: {
      loadout_slot: `Complete this set to unlock +${bonusValue} Loadout Slot for Story Mode!`,
      penalty_reduction: `Complete this set to reduce Story XP penalties by ${Number(bonusValue) * 100}%!`,
    },
    achievements: {
      xp_multiplier: `Equip this achievement for +${Number(bonusValue) * 100}% XP in themed stories!`,
    },
    mastery: {
      xp_bonus: `Master this book to earn ${bonusValue} bonus XP in Story Mode!`,
    },
  };

  return messages[pillar]?.[bonusType] || "";
}

/**
 * Check if user has engaged with a specific pillar.
 */
export function hasPillarEngagement(
  pillar: "collectibles" | "achievements" | "stories" | "mastery",
  state: {
    collectibleCount: number;
    achievementCount: number;
    storyCount: number;
    masteryCount: number;
  },
): boolean {
  switch (pillar) {
    case "collectibles":
      return state.collectibleCount > 0;
    case "achievements":
      return state.achievementCount > 0;
    case "stories":
      return state.storyCount > 0;
    case "mastery":
      return state.masteryCount > 0;
    default:
      return false;
  }
}
