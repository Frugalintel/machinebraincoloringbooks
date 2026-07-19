export interface Product {
  id: string; // Changed from number to string for UUID
  title: string;
  subtitle: string;
  description: string;
  price: number;
  discount_percent: number;
  category: string;
  difficulty: number;
  age: string;
  color: string;
  accent: string;
  image_url?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Collectible {
  id: string;
  name: string;
  image_url?: string;
  requirement: string;
  lore: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  type: string;
  generation: string;
  found_in: string;
  set_id?: string;
}

export interface CollectionSet {
  id: string;
  title: string;
  reward: string;
  total_items: number;
  items?: Collectible[];
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  valid_until?: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
}

export interface AchievementTriggerConfig {
  product_id?: string;
  category?: string;
  threshold?: number;
  code?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  is_secret: boolean;
  trigger_type?: string;
  trigger_config?: AchievementTriggerConfig;
  rarity?: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  custom_color?: string;
  created_at?: string;
}

export interface StoryRequirement {
  type: "product" | "achievement" | "collectible";
  id: string;
  name: string;
}

export interface StoryReward {
  type: "discount" | "product" | "achievement";
  id?: string;
  amount?: number;
  description: string;
}

export interface StoryChallenge {
  type: "riddle" | "timer" | "input" | "scan";
  config: {
    question?: string;
    answer?: string;
    duration?: number;
    target_code?: string;
    failure_node_id?: string;
  };
}

export interface StoryNode {
  id: string;
  content: string;
  choices: { text: string; nextNodeId: string }[];
  image_url?: string;
  audio_url?: string;
  type?: "text" | "choice" | "ending" | "challenge";
  challenge?: StoryChallenge;
  position?: { x: number; y: number };
}

export interface FrameworkConfig {
  id: string;
  name: string;
  description: string;
  defaultVariables: Record<string, string>;
  generate: (variables: Record<string, string>) => Story;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  cover_url?: string;
  content: StoryNode[];
  requirements: StoryRequirement[];
  rewards: StoryReward[];
  code_needed?: string;
  is_published: boolean;
  difficulty?: number;
  estimated_minutes?: number;
  tags?: string[];
  created_at?: string;
}

export interface StoryAnalytics {
  id: string;
  story_id: string;
  user_id?: string;
  event_type: "start" | "node_complete" | "choice" | "complete" | "abandon";
  node_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BookCode {
  id: string;
  code: string;
  product_id?: string;
  page_number?: number;
  unlocks_type: "story" | "story_node" | "collectible" | "achievement";
  unlocks_id?: string;
  is_active: boolean;
}

export interface UserCode {
  id: string;
  user_id: string;
  code_id: string;
  entered_at: string;
}

export interface UserStoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  current_node_id: string;
  completed_nodes: string[];
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  is_unlocked: boolean;
  unlocked_at?: string;
}

export interface UserCollectible {
  id: string;
  user_id: string;
  collectible_id: string;
  unlocked_at: string;
  last_polished_at?: string;
}

export interface CampaignTheme {
  id: string;
  name?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  text: {
    heroTitle: string;
    heroSubtitle: string;
    heroTag: string;
    storyTag: string;
    heroDescription?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  texture?: "noise" | "grid" | "dots" | "scanlines" | "none";
  animation?: "none" | "pulse" | "marquee" | "glitch";
  fontMode?: "default" | "mono" | "serif";
}

export interface CampaignSettings {
  isActive: boolean;
  name: string;
  featuredProductId?: string;

  discount: {
    enabled: boolean;
    type: "percentage" | "fixed";
    value: number;
    scope: "global" | "category" | "collection";
    targetIds?: string[];
  };

  banner: {
    enabled: boolean;
    text: string;
    link: string;
    backgroundColor: string;
    textColor: string;
    backgroundImage?: string;
    pattern?: "none" | "caution" | "grid" | "dots" | "gradient";
    customCss?: string; // For advanced customization
  };

  theme?: CampaignTheme;
}

// Keeping this for backwards compatibility if needed, but we should migrate
export interface GlobalDiscountSettings {
  enabled: boolean;
  percentage: number;
  label: string;
}

export interface SystemSettings {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  updated_at?: string;
  updated_by?: string;
}

// Admin Activity Types
export interface AdminActivity {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  target_id?: string;
  details: Record<string, unknown>;
  created_at: string;
}

// Database row types for direct queries
export interface DatabaseProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  discount_percent: number;
  category: string;
  difficulty: number;
  age: string;
  color: string;
  accent: string;
  image_url?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseStoryProgress {
  story_id: string;
  stories?: {
    title: string;
  };
}

export interface DatabaseRevenueData {
  date: string;
  revenue: number;
}

export interface DatabaseCategoryData {
  category: string;
  count: string | number;
}

export interface SelectOption {
  id: string;
  title: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  user?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ProductRating {
  product_id: string;
  average_rating: number;
  review_count: number;
}

// ============================================================================
// UNIFIED PILLAR SYSTEM TYPES
// ============================================================================

// Reward Types
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
  category?: string;
}

export interface SetReward {
  standalone: StandaloneReward;
  crossPillar?: CrossPillarBonus;
}

// Trophy Customization
export interface TrophyCustomization {
  collectibleId: string;
  skin: string;
  pedestal: string;
  updatedAt?: string;
}

// Story Gate Types (Soft Gates)
export interface StoryGateRequirement {
  type: "achievement" | "collectible" | "product";
  id: string;
  mode?: "owned" | "equipped";
}

export interface StoryGate {
  id: string;
  storyId: string;
  nodeId: string;
  requirements: StoryGateRequirement[];
  bypassXpCost: number;
  bypassAlternatives?: StoryGateRequirement[];
  isHardGate: boolean;
}

// Extended Story with pillar system fields
export interface StoryExtended extends Story {
  category?: string;
  storyType?: "minor" | "full";
  coreBookIds?: string[];
  baseXp?: number;
}

// Extended Story Progress with strikes/XP
export interface UserStoryProgressExtended extends UserStoryProgress {
  xpEarned: number;
  strikes: number;
  gatesSkipped: string[];
}

// User Book (Ownership & Mastery)
export interface UserBook {
  id: string;
  userId: string;
  productId: string;
  acquiredAt: string;
  // Mastery track
  milestonesCompleted: number;
  masteryComplete: boolean;
  completionPhotoUrl?: string;
  // Story track (optional)
  isSacrificed: boolean;
  sacrificedForStoryId?: string;
  // Joined product data
  product?: Product;
}

// Book Milestone
export interface BookMilestone {
  id: string;
  productId: string;
  milestoneType: "small" | "big";
  pageNumber?: number;
  code?: string;
  baseXp: number;
  sortOrder: number;
}

// User Milestone Progress
export interface UserMilestoneProgress {
  id: string;
  userId: string;
  milestoneId: string;
  completedAt: string;
  coloredUploadUrl?: string;
  xpEarned: number;
  // Joined milestone data
  milestone?: BookMilestone;
}

// XP Transaction
export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  sourceType:
    | "milestone"
    | "story_complete"
    | "gate_skip"
    | "mastery"
    | "achievement";
  sourceId?: string;
  multipliers: Record<string, number>;
  rawAmount?: number;
  createdAt: string;
}

// Set Completion
export interface UserSetCompletion {
  id: string;
  userId: string;
  setId: string;
  completedAt: string;
  rewardClaimed: boolean;
}

// Extended Achievement with pillar system fields
export interface AchievementExtended extends Achievement {
  tier?: "bronze" | "silver" | "gold" | "platinum";
  standaloneReward?: StandaloneReward;
  crossPillarBonus?: CrossPillarBonus;
}

// Extended User Achievement with tier
export interface UserAchievementExtended extends UserAchievement {
  tierReached: "bronze" | "silver" | "gold" | "platinum";
}

// Extended Profile with pillar scores
export interface ProfileExtended extends Profile {
  totalXp?: number;
  collectorScore?: number;
  achievementScore?: number;
  displayTitle?: string;
  profileFrame?: string;
}

// Pillar Progress Summary
export interface PillarProgress {
  collectibles: {
    total: number;
    collected: number;
    score: number;
    completedSets: string[];
  };
  achievements: {
    total: number;
    unlocked: number;
    score: number;
    equipped: string[];
  };
  stories: {
    total: number;
    completed: number;
    inProgress: number;
    totalXp: number;
    level: number;
  };
  mastery: {
    totalBooks: number;
    mastered: number;
    inProgress: number;
    score: number;
  };
}

// Milestone reward info
export interface MilestoneRewardInfo {
  threshold: number;
  reward: StandaloneReward;
  achieved: boolean;
}

// Invitation Card Props
export interface InvitationData {
  title: string;
  standaloneReward: string;
  crossPillarInvitation?: string;
  ctaText: string;
  ctaLink: string;
}

// Gate Check Result (for UI)
export interface GateCheckResultUI {
  canPass: boolean;
  hasRequirement: boolean;
  requirementLabel?: string;
  bypassOptions?: {
    xpCost?: number;
    canAfford?: boolean;
    alternatives?: Array<{
      type: string;
      id: string;
      label: string;
      link: string;
    }>;
  };
}
