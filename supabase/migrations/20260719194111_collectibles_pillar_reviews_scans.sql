-- Collectibles, pillar system, reviews, page scans, story analytics

-- COLLECTION SETS & COLLECTIBLES
CREATE TABLE IF NOT EXISTS collection_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  reward TEXT,
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collectibles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  requirement TEXT,
  lore TEXT,
  rarity TEXT DEFAULT 'Common' CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
  type TEXT,
  generation TEXT,
  found_in TEXT,
  set_id UUID REFERENCES collection_sets(id) ON DELETE SET NULL,
  related_achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collectibles_set_id ON collectibles(set_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_rarity ON collectibles(rarity);

ALTER TABLE collection_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Collection Sets" ON collection_sets FOR SELECT USING (true);
CREATE POLICY "Admin manage collection sets" ON collection_sets FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public Read Collectibles" ON collectibles FOR SELECT USING (true);
CREATE POLICY "Admin manage collectibles" ON collectibles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_collection_sets_updated_at ON collection_sets;
CREATE TRIGGER update_collection_sets_updated_at BEFORE UPDATE ON collection_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_collectibles_updated_at ON collectibles;
CREATE TRIGGER update_collectibles_updated_at BEFORE UPDATE ON collectibles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PILLAR SYSTEM
CREATE TABLE IF NOT EXISTS collectible_set_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id TEXT NOT NULL UNIQUE,
  standalone_reward JSONB NOT NULL,
  cross_pillar_bonus JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_set_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, set_id)
);

CREATE TABLE IF NOT EXISTS user_trophy_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL,
  skin TEXT DEFAULT 'default',
  pedestal TEXT DEFAULT 'default',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, collectible_id)
);

CREATE TABLE IF NOT EXISTS story_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  requirements JSONB NOT NULL,
  bypass_xp_cost INTEGER DEFAULT 500,
  bypass_alternatives JSONB,
  is_hard_gate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, node_id)
);

CREATE TABLE IF NOT EXISTS user_xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  multipliers JSONB DEFAULT '{}',
  raw_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  milestones_completed INTEGER DEFAULT 0,
  mastery_complete BOOLEAN DEFAULT false,
  completion_photo_url TEXT,
  is_sacrificed BOOLEAN DEFAULT false,
  sacrificed_for_story_id UUID REFERENCES stories(id),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS book_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('small', 'big')),
  page_number INTEGER,
  code TEXT UNIQUE,
  base_xp INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES book_milestones(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  colored_upload_url TEXT,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, milestone_id)
);

ALTER TABLE collectible_set_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_set_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophy_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestone_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read collectible_set_rewards" ON collectible_set_rewards FOR SELECT USING (true);
CREATE POLICY "Public read story_gates" ON story_gates FOR SELECT USING (true);
CREATE POLICY "Public read book_milestones" ON book_milestones FOR SELECT USING (true);
CREATE POLICY "Users own set_completions" ON user_set_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own trophy_customizations" ON user_trophy_customizations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own xp_transactions" ON user_xp_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own books" ON user_books FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own milestone_progress" ON user_milestone_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_set_completions_user ON user_set_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_transactions_user ON user_xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_user ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_book_milestones_product ON book_milestones(product_id);
CREATE INDEX IF NOT EXISTS idx_story_gates_story ON story_gates(story_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users Insert Own Reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users Update Own Reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users Delete Own Reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_product_rating(p_id UUID)
RETURNS TABLE(average_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)
  FROM reviews WHERE product_id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW product_ratings AS
SELECT product_id, ROUND(AVG(rating)::numeric, 1) as average_rating, COUNT(*) as review_count
FROM reviews GROUP BY product_id;

-- PAGE SCANS
CREATE TABLE IF NOT EXISTS page_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID REFERENCES book_codes(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE page_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own scans" ON page_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scans" ON page_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('page-scans', 'page-scans', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users can upload scan images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'page-scans');
CREATE POLICY "Public Access to Scans" ON storage.objects FOR SELECT TO public USING (bucket_id = 'page-scans');

-- STORY ANALYTICS
CREATE TABLE IF NOT EXISTS story_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  node_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE story_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view analytics" ON story_analytics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users insert own analytics" ON story_analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
