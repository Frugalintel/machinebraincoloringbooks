/**
 * PILLAR REWARDS SYSTEM
 *
 * Defines standalone rewards per pillar that provide value independent of other pillars.
 * Cross-pillar bonuses are "invitations" that enhance (but never require) engagement.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RewardType =
  | "trophy_skin"
  | "trophy_pedestal"
  | "profile_frame"
  | "title"
  | "trophy_room_theme"
  | "badge_border"
  | "mastery_badge";

export type CrossPillarBonusType =
  | "loadout_slot"
  | "penalty_reduction"
  | "xp_multiplier";

export interface StandaloneReward {
  type: RewardType;
  value: string;
  label: string;
}

export interface CrossPillarBonus {
  type: CrossPillarBonusType;
  value: number;
  label: string;
  category?: string; // For category-specific bonuses
}

export interface SetReward {
  standalone: StandaloneReward;
  crossPillar?: CrossPillarBonus;
}

export interface MilestoneReward {
  threshold: number;
  reward: StandaloneReward;
}

export interface TierReward {
  type: RewardType;
  value: string;
  bonusXP?: number;
}

// ============================================================================
// COLLECTIBLES PILLAR REWARDS
// ============================================================================

/**
 * Rewards for completing collectible sets.
 * Standalone rewards work without any story engagement.
 * Cross-pillar bonuses are optional "invitations" to try stories.
 */
export const COLLECTIBLE_SET_REWARDS: Record<string, SetReward> = {
  "set-01": {
    // Vacuum Pups
    standalone: {
      type: "trophy_skin",
      value: "gold",
      label: "Golden Trophy Skin",
    },
    crossPillar: {
      type: "loadout_slot",
      value: 1,
      label: "+1 Loadout Slot",
    },
  },
  "set-02": {
    // Star Drifter
    standalone: {
      type: "trophy_pedestal",
      value: "holographic",
      label: "Holographic Pedestal",
    },
    crossPillar: {
      type: "penalty_reduction",
      value: 0.25,
      label: "-25% Cross-Category Penalty",
    },
  },
};

/**
 * Collector milestones - earned by collecting trophies.
 * Provides standalone progression separate from stories/XP.
 */
export const COLLECTOR_MILESTONES: MilestoneReward[] = [
  {
    threshold: 5,
    reward: {
      type: "title",
      value: "novice_collector",
      label: "Novice Collector",
    },
  },
  {
    threshold: 15,
    reward: {
      type: "profile_frame",
      value: "bronze_collector",
      label: "Bronze Collector Frame",
    },
  },
  {
    threshold: 30,
    reward: { type: "title", value: "master_curator", label: "Master Curator" },
  },
  {
    threshold: 50,
    reward: {
      type: "trophy_room_theme",
      value: "museum",
      label: "Museum Theme",
    },
  },
  {
    threshold: 100,
    reward: {
      type: "profile_frame",
      value: "legendary_collector",
      label: "Legendary Collector Frame",
    },
  },
];

/**
 * Available trophy skins that can be unlocked.
 */
export const TROPHY_SKINS = [
  { id: "default", label: "Default", unlockMethod: "default" },
  { id: "gold", label: "Gold", unlockMethod: "set_reward" },
  { id: "platinum", label: "Platinum", unlockMethod: "set_reward" },
  { id: "holographic", label: "Holographic", unlockMethod: "set_reward" },
  { id: "neon", label: "Neon", unlockMethod: "achievement" },
  { id: "crystal", label: "Crystal", unlockMethod: "mastery" },
] as const;

/**
 * Available trophy pedestals.
 */
export const TROPHY_PEDESTALS = [
  { id: "default", label: "Standard", unlockMethod: "default" },
  { id: "marble", label: "Marble", unlockMethod: "collector_milestone" },
  { id: "holographic", label: "Holographic", unlockMethod: "set_reward" },
  { id: "floating", label: "Floating", unlockMethod: "achievement" },
] as const;

// ============================================================================
// ACHIEVEMENTS PILLAR REWARDS
// ============================================================================

/**
 * Achievement tier rewards - each achievement can progress through tiers.
 * Provides standalone progression separate from stories/XP.
 */
export const ACHIEVEMENT_TIER_REWARDS: Record<string, TierReward> = {
  bronze: {
    type: "badge_border",
    value: "bronze",
  },
  silver: {
    type: "badge_border",
    value: "silver",
    bonusXP: 50,
  },
  gold: {
    type: "badge_border",
    value: "gold",
    bonusXP: 100,
  },
  platinum: {
    type: "profile_frame",
    value: "platinum_achiever",
    bonusXP: 250,
  },
};

/**
 * Achievement milestones - earned by unlocking achievements.
 * Provides standalone progression separate from stories/XP.
 */
export const ACHIEVEMENT_MILESTONES: MilestoneReward[] = [
  {
    threshold: 5,
    reward: { type: "title", value: "badge_hunter", label: "Badge Hunter" },
  },
  {
    threshold: 10,
    reward: {
      type: "profile_frame",
      value: "bronze_achiever",
      label: "Bronze Achiever Frame",
    },
  },
  {
    threshold: 25,
    reward: {
      type: "title",
      value: "achievement_hunter",
      label: "Achievement Hunter",
    },
  },
  {
    threshold: 50,
    reward: {
      type: "profile_frame",
      value: "gold_achiever",
      label: "Gold Achiever Frame",
    },
  },
  {
    threshold: 100,
    reward: { type: "title", value: "completionist", label: "Completionist" },
  },
];

/**
 * Category-specific XP bonuses from achievements.
 * These are cross-pillar "invitations" to try stories.
 */
export const ACHIEVEMENT_CATEGORY_BONUSES: Record<
  string,
  { achievementIds: string[]; bonus: number }
> = {
  Nature: {
    achievementIds: ["ach-33", "ach-44"], // Jungle Explorer, Animal Lover
    bonus: 0.1, // +10% XP each
  },
  Space: {
    achievementIds: ["ach-32"], // Space Cadet
    bonus: 0.1,
  },
  Cyberpunk: {
    achievementIds: ["ach-06"], // Neon Nights
    bonus: 0.1,
  },
  Fantasy: {
    achievementIds: ["ach-37"], // Fantasy Weaver
    bonus: 0.1,
  },
};

// ============================================================================
// MASTERY PILLAR REWARDS (Book completion - standalone from stories)
// ============================================================================

/**
 * Per-book mastery reward.
 * XP is optional - the badge is the standalone reward.
 */
export const MASTERY_PER_BOOK = {
  standaloneReward: {
    type: "mastery_badge" as RewardType,
    value: "book_master",
    label: "Book Mastery Badge",
  },
  xpBonus: 800, // Optional for story players
};

/**
 * Mastery milestones - earned by mastering multiple books.
 * Provides standalone progression separate from stories/XP.
 */
export const MASTERY_MILESTONES: MilestoneReward[] = [
  {
    threshold: 1,
    reward: { type: "title", value: "first_master", label: "First Mastery" },
  },
  {
    threshold: 3,
    reward: {
      type: "title",
      value: "dedicated_colorist",
      label: "Dedicated Colorist",
    },
  },
  {
    threshold: 10,
    reward: {
      type: "profile_frame",
      value: "master_colorist",
      label: "Master Colorist Frame",
    },
  },
  {
    threshold: 25,
    reward: {
      type: "title",
      value: "coloring_legend",
      label: "Coloring Legend",
    },
  },
  {
    threshold: 50,
    reward: {
      type: "trophy_room_theme",
      value: "gallery",
      label: "Gallery Theme",
    },
  },
  {
    threshold: 100,
    reward: {
      type: "profile_frame",
      value: "ultimate_master",
      label: "Ultimate Master Frame",
    },
  },
];

// ============================================================================
// PROFILE CUSTOMIZATION OPTIONS
// ============================================================================

/**
 * Available profile frames and how to unlock them.
 */
export const PROFILE_FRAMES = [
  { id: "default", label: "Default", unlockMethod: "default" },
  {
    id: "bronze_collector",
    label: "Bronze Collector",
    unlockMethod: "collector_milestone",
    threshold: 15,
  },
  {
    id: "legendary_collector",
    label: "Legendary Collector",
    unlockMethod: "collector_milestone",
    threshold: 100,
  },
  {
    id: "bronze_achiever",
    label: "Bronze Achiever",
    unlockMethod: "achievement_milestone",
    threshold: 10,
  },
  {
    id: "gold_achiever",
    label: "Gold Achiever",
    unlockMethod: "achievement_milestone",
    threshold: 50,
  },
  {
    id: "platinum_achiever",
    label: "Platinum Achiever",
    unlockMethod: "achievement_tier",
  },
  {
    id: "master_colorist",
    label: "Master Colorist",
    unlockMethod: "mastery_milestone",
    threshold: 10,
  },
  {
    id: "ultimate_master",
    label: "Ultimate Master",
    unlockMethod: "mastery_milestone",
    threshold: 100,
  },
] as const;

/**
 * Available display titles and how to unlock them.
 */
export const DISPLAY_TITLES = [
  {
    id: "novice_collector",
    label: "Novice Collector",
    unlockMethod: "collector_milestone",
    threshold: 5,
  },
  {
    id: "master_curator",
    label: "Master Curator",
    unlockMethod: "collector_milestone",
    threshold: 30,
  },
  {
    id: "badge_hunter",
    label: "Badge Hunter",
    unlockMethod: "achievement_milestone",
    threshold: 5,
  },
  {
    id: "achievement_hunter",
    label: "Achievement Hunter",
    unlockMethod: "achievement_milestone",
    threshold: 25,
  },
  {
    id: "completionist",
    label: "Completionist",
    unlockMethod: "achievement_milestone",
    threshold: 100,
  },
  {
    id: "first_master",
    label: "First Mastery",
    unlockMethod: "mastery_milestone",
    threshold: 1,
  },
  {
    id: "dedicated_colorist",
    label: "Dedicated Colorist",
    unlockMethod: "mastery_milestone",
    threshold: 3,
  },
  {
    id: "coloring_legend",
    label: "Coloring Legend",
    unlockMethod: "mastery_milestone",
    threshold: 25,
  },
] as const;

/**
 * Available trophy room themes.
 */
export const TROPHY_ROOM_THEMES = [
  { id: "default", label: "Default", unlockMethod: "default" },
  {
    id: "museum",
    label: "Museum",
    unlockMethod: "collector_milestone",
    threshold: 50,
  },
  {
    id: "gallery",
    label: "Gallery",
    unlockMethod: "mastery_milestone",
    threshold: 50,
  },
  { id: "neon", label: "Neon", unlockMethod: "achievement" },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current collector milestone based on total collectibles.
 */
export function getCurrentCollectorMilestone(
  totalCollectibles: number,
): MilestoneReward | null {
  const achieved = COLLECTOR_MILESTONES.filter(
    (m) => totalCollectibles >= m.threshold,
  );
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

/**
 * Get the next collector milestone to work toward.
 */
export function getNextCollectorMilestone(
  totalCollectibles: number,
): MilestoneReward | null {
  return (
    COLLECTOR_MILESTONES.find((m) => totalCollectibles < m.threshold) || null
  );
}

/**
 * Get the current achievement milestone based on total achievements.
 */
export function getCurrentAchievementMilestone(
  totalAchievements: number,
): MilestoneReward | null {
  const achieved = ACHIEVEMENT_MILESTONES.filter(
    (m) => totalAchievements >= m.threshold,
  );
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

/**
 * Get the next achievement milestone to work toward.
 */
export function getNextAchievementMilestone(
  totalAchievements: number,
): MilestoneReward | null {
  return (
    ACHIEVEMENT_MILESTONES.find((m) => totalAchievements < m.threshold) || null
  );
}

/**
 * Get the current mastery milestone based on total mastered books.
 */
export function getCurrentMasteryMilestone(
  masteredBooks: number,
): MilestoneReward | null {
  const achieved = MASTERY_MILESTONES.filter(
    (m) => masteredBooks >= m.threshold,
  );
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

/**
 * Get the next mastery milestone to work toward.
 */
export function getNextMasteryMilestone(
  masteredBooks: number,
): MilestoneReward | null {
  return MASTERY_MILESTONES.find((m) => masteredBooks < m.threshold) || null;
}

/**
 * Get set reward by set ID.
 */
export function getSetReward(setId: string): SetReward | null {
  return COLLECTIBLE_SET_REWARDS[setId] || null;
}

/**
 * Calculate total loadout slots based on completed sets.
 * Base: 5 slots, +1 per completed set with loadout_slot bonus.
 */
export function calculateLoadoutSlots(completedSetIds: string[]): number {
  const BASE_SLOTS = 5;
  const bonusSlots = completedSetIds.reduce((total, setId) => {
    const reward = COLLECTIBLE_SET_REWARDS[setId];
    if (reward?.crossPillar?.type === "loadout_slot") {
      return total + reward.crossPillar.value;
    }
    return total;
  }, 0);
  return BASE_SLOTS + bonusSlots;
}

/**
 * Calculate XP penalty reduction from completed sets.
 * Returns the total penalty reduction as a decimal (e.g., 0.25 = 25% reduction).
 */
export function calculatePenaltyReduction(completedSetIds: string[]): number {
  return completedSetIds.reduce((total, setId) => {
    const reward = COLLECTIBLE_SET_REWARDS[setId];
    if (reward?.crossPillar?.type === "penalty_reduction") {
      return total + reward.crossPillar.value;
    }
    return total;
  }, 0);
}

/**
 * Get achievement category XP bonus for equipped achievements.
 */
export function getAchievementCategoryBonus(
  equippedAchievementIds: string[],
  category: string,
): number {
  const categoryConfig = ACHIEVEMENT_CATEGORY_BONUSES[category];
  if (!categoryConfig) return 0;

  const matchingAchievements = equippedAchievementIds.filter((id) =>
    categoryConfig.achievementIds.includes(id),
  );

  return matchingAchievements.length * categoryConfig.bonus;
}
