-- 1. Codes hidden in physical books
CREATE TABLE IF NOT EXISTS book_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Which book contains this code
  page_number INTEGER, -- Optional: which page
  unlocks_type TEXT NOT NULL, -- 'story', 'story_node', 'collectible', 'achievement'
  unlocks_id UUID, -- ID of the thing it unlocks (can be null if it just unlocks a generic achievement)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User's entered codes (to prevent re-use if desired, or just track history)
CREATE TABLE IF NOT EXISTS user_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES book_codes(id) ON DELETE CASCADE,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, code_id)
);

-- 3. User story progress
CREATE TABLE IF NOT EXISTS user_story_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_node_id TEXT, -- ID of the current node in the JSON story tree
  completed_nodes JSONB DEFAULT '[]'::jsonb, -- Array of node IDs completed
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, story_id)
);

-- 4. User Achievement Progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- 5. User Collectibles
CREATE TABLE IF NOT EXISTS user_collectibles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id UUID NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, collectible_id)
);

-- RLS Policies
ALTER TABLE book_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;

-- Public can read active book codes (needed for validation)
CREATE POLICY "Authenticated Read Book Codes" ON book_codes FOR SELECT USING (auth.role() = 'authenticated');

-- Users can read/write their own data
CREATE POLICY "Users own codes" ON user_codes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own story progress" ON user_story_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own collectibles" ON user_collectibles FOR ALL USING (auth.uid() = user_id);

-- Admin write access (reuse your existing admin logic/role check)
CREATE POLICY "Admin Write Book Codes" ON book_codes FOR ALL USING (auth.role() = 'authenticated');
