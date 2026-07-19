-- ============================================================================
-- UNIFIED PILLAR SYSTEM SETUP
-- ============================================================================
-- Creates modular tables for each pillar (Collectibles, Achievements, Stories)
-- Each pillar works standalone with optional cross-pillar bonuses
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE PROFILE EXTENSIONS (Pillar-agnostic stats)
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS collector_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievement_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_frame TEXT;

-- ============================================================================
-- COLLECTIBLES PILLAR TABLES
-- ============================================================================

-- Collectible set rewards (standalone value + optional cross-pillar bonus)
CREATE TABLE IF NOT EXISTS collectible_set_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id TEXT NOT NULL UNIQUE,
  standalone_reward JSONB NOT NULL, -- { type: 'trophy_skin', value: 'gold', label: '...' }
  cross_pillar_bonus JSONB, -- { type: 'loadout_slot', value: 1, label: '...' } (optional)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User set completion tracking
CREATE TABLE IF NOT EXISTS user_set_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, set_id)
);

-- Trophy customization (standalone reward usage)
CREATE TABLE IF NOT EXISTS user_trophy_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL,
  skin TEXT DEFAULT 'default', -- 'default', 'gold', 'platinum', 'holographic'
  pedestal TEXT DEFAULT 'default',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, collectible_id)
);

-- ============================================================================
-- ACHIEVEMENTS PILLAR TABLES
-- ============================================================================

-- Achievement tiers for standalone progression
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze'; -- bronze, silver, gold, platinum
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS standalone_reward JSONB; -- { type: 'profile_frame', value: 'neon' }
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS cross_pillar_bonus JSONB; -- { type: 'xp_multiplier', category: 'Nature', value: 0.1 }

-- User achievement progress (extended with tier tracking)
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS tier_reached TEXT DEFAULT 'bronze';

-- ============================================================================
-- STORIES PILLAR TABLES
-- ============================================================================

-- Story gates with bypass options (soft gates by default)
CREATE TABLE IF NOT EXISTS story_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  requirements JSONB NOT NULL, -- [{ type: 'achievement', id: '...', mode: 'equipped' }]
  bypass_xp_cost INTEGER DEFAULT 500,
  bypass_alternatives JSONB, -- [{ type: 'collectible', id: '...' }]
  is_hard_gate BOOLEAN DEFAULT false, -- Only true for ~1% prestige content
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, node_id)
);

-- Extended story progress with strike system
ALTER TABLE user_story_progress ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;
ALTER TABLE user_story_progress ADD COLUMN IF NOT EXISTS strikes INTEGER DEFAULT 0;
ALTER TABLE user_story_progress ADD COLUMN IF NOT EXISTS gates_skipped TEXT[] DEFAULT '{}';

-- Story category and type for XP calculations
ALTER TABLE stories ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'full'; -- 'minor' or 'full'
ALTER TABLE stories ADD COLUMN IF NOT EXISTS core_book_ids UUID[] DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS base_xp INTEGER DEFAULT 2500;

-- XP transactions ledger (for story players)
CREATE TABLE IF NOT EXISTS user_xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'milestone', 'story_complete', 'gate_skip', 'mastery', 'achievement'
  source_id TEXT,
  multipliers JSONB DEFAULT '{}',
  raw_amount INTEGER, -- Before multipliers
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- BOOK/MASTERY TABLES (Shared infrastructure for collectors AND story players)
-- ============================================================================

-- User book ownership and mastery tracking
CREATE TABLE IF NOT EXISTS user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  -- Mastery track (standalone)
  milestones_completed INTEGER DEFAULT 0,
  mastery_complete BOOLEAN DEFAULT false,
  completion_photo_url TEXT,
  -- Story track (optional)
  is_sacrificed BOOLEAN DEFAULT false,
  sacrificed_for_story_id UUID REFERENCES stories(id),
  UNIQUE(user_id, product_id)
);

-- Book milestones (shared by mastery AND story tracks)
CREATE TABLE IF NOT EXISTS book_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('small', 'big')),
  page_number INTEGER,
  code TEXT UNIQUE,
  base_xp INTEGER NOT NULL, -- 20 for small, 80 for big
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User milestone progress
CREATE TABLE IF NOT EXISTS user_milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES book_milestones(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  colored_upload_url TEXT, -- If provided, earns colored bonus
  xp_earned INTEGER DEFAULT 0, -- 0 if user doesn't care about XP
  UNIQUE(user_id, milestone_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE collectible_set_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_set_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophy_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestone_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public read collectible_set_rewards" ON collectible_set_rewards 
  FOR SELECT USING (true);

CREATE POLICY "Public read story_gates" ON story_gates 
  FOR SELECT USING (true);

CREATE POLICY "Public read book_milestones" ON book_milestones 
  FOR SELECT USING (true);

-- Users own their data
CREATE POLICY "Users own set_completions" ON user_set_completions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own trophy_customizations" ON user_trophy_customizations 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own xp_transactions" ON user_xp_transactions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own books" ON user_books 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own milestone_progress" ON user_milestone_progress 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: Default Set Rewards
-- ============================================================================

INSERT INTO collectible_set_rewards (set_id, standalone_reward, cross_pillar_bonus) VALUES
  ('set-01', '{"type": "trophy_skin", "value": "gold", "label": "Golden Trophy Skin"}', '{"type": "loadout_slot", "value": 1, "label": "+1 Loadout Slot"}'),
  ('set-02', '{"type": "trophy_pedestal", "value": "holographic", "label": "Holographic Pedestal"}', '{"type": "penalty_reduction", "value": 0.25, "label": "-25% XP Penalty"}')
ON CONFLICT (set_id) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_set_completions_user ON user_set_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trophy_customizations_user ON user_trophy_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_transactions_user ON user_xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_transactions_created ON user_xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_books_user ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_user ON user_milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_book_milestones_product ON book_milestones(product_id);
CREATE INDEX IF NOT EXISTS idx_story_gates_story ON story_gates(story_id);
