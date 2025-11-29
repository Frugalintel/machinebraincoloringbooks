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
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  is_secret: boolean;
  trigger_type?: string;
  trigger_config?: any;
  created_at?: string;
}

export interface StoryRequirement {
  type: 'product' | 'achievement' | 'collectible';
  id: string;
  name: string;
}

export interface StoryReward {
  type: 'discount' | 'product' | 'achievement';
  id?: string;
  amount?: number;
  description: string;
}

export interface StoryNode {
  id: string;
  content: string;
  choices: { text: string; nextNodeId: string }[];
  image_url?: string;
  type?: 'text' | 'choice' | 'ending';
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
  created_at?: string;
}

export interface BookCode {
  id: string;
  code: string;
  product_id?: string;
  page_number?: number;
  unlocks_type: 'story' | 'story_node' | 'collectible' | 'achievement';
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
}

export interface CampaignTheme {
  id: string;
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
  };
}

export interface CampaignSettings {
  isActive: boolean;
  name: string;
  featuredProductId?: string;
  
  discount: {
    enabled: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    scope: 'global' | 'category' | 'collection';
    targetIds?: string[];
  };

  banner: {
    enabled: boolean;
    text: string;
    link: string;
    backgroundColor: string;
    textColor: string;
    customCss?: string; // For advanced customization
  };

  theme?: CampaignTheme;
}

// Keeping this for backwards compatibility if needed, but we should migrate
export type GlobalDiscountSettings = CampaignSettings; 

export interface SystemSettings {
  key: string;
  value: any;
  updated_at?: string;
  updated_by?: string;
}
