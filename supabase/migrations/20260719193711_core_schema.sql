-- Core schema: profiles, achievements, stories, products, codes, progress
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  total_xp INTEGER DEFAULT 0,
  collector_score INTEGER DEFAULT 0,
  achievement_score INTEGER DEFAULT 0,
  display_title TEXT,
  profile_frame TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin helper based on profiles.is_admin (matches app code)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  category TEXT,
  difficulty INTEGER DEFAULT 1,
  age TEXT,
  color TEXT,
  accent TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  target_value INTEGER DEFAULT 1,
  is_secret BOOLEAN DEFAULT false,
  trigger_type TEXT,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  rarity TEXT DEFAULT 'Common',
  custom_color TEXT,
  tier TEXT DEFAULT 'bronze',
  standalone_reward JSONB,
  cross_pillar_bonus JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STORIES
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  cover_url TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  rewards JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  difficulty INTEGER DEFAULT 1,
  estimated_minutes INTEGER,
  tags TEXT[],
  category TEXT,
  story_type TEXT DEFAULT 'full',
  core_book_ids UUID[] DEFAULT '{}',
  base_xp INTEGER DEFAULT 2500,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- BOOK CODES
CREATE TABLE IF NOT EXISTS book_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  unlocks_type TEXT NOT NULL,
  unlocks_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES book_codes(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, code_id)
);

CREATE TABLE IF NOT EXISTS user_story_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_node_id TEXT,
  completed_nodes JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  strikes INTEGER DEFAULT 0,
  gates_skipped TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, story_id)
);

-- USER GAME TABLES
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  tier_reached TEXT DEFAULT 'bronze',
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_collectibles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL,
  set_id TEXT,
  collected_at TIMESTAMPTZ DEFAULT now(),
  last_polished_at TIMESTAMPTZ,
  UNIQUE(user_id, collectible_id)
);

CREATE TABLE IF NOT EXISTS user_active_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_active_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: public read published, admin write
CREATE POLICY "Public read published products" ON products FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin manage products" ON products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Achievements/Stories public read
CREATE POLICY "Public Read Achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Admin manage achievements" ON achievements FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public read published stories" ON stories FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin manage stories" ON stories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Book codes
CREATE POLICY "Authenticated Read Book Codes" ON book_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage book codes" ON book_codes FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- User-owned rows
CREATE POLICY "Users own codes" ON user_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own story progress" ON user_story_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own collectibles" ON user_collectibles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own active achievements" ON user_active_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collectibles_user_id ON user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_story_progress_user_id ON user_story_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_collectibles_timestamps ON user_collectibles(user_id, collected_at, last_polished_at);
