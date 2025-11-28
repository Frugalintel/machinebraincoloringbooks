-- Real Authentication Setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 3. USER COLLECTIBLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_collectibles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL,
  set_id TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, collectible_id)
);

-- ============================================
-- 4. USER ACTIVE ACHIEVEMENTS (loadout)
-- ============================================
CREATE TABLE IF NOT EXISTS user_active_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;

CREATE POLICY "Public profiles" ON profiles 
  FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users write own achievements" ON user_achievements;

CREATE POLICY "Users read own achievements" ON user_achievements 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own achievements" ON user_achievements 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Collectibles
ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own collectibles" ON user_collectibles;
DROP POLICY IF EXISTS "Users write own collectibles" ON user_collectibles;

CREATE POLICY "Users read own collectibles" ON user_collectibles 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own collectibles" ON user_collectibles 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Active Achievements
ALTER TABLE user_active_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own active achievements" ON user_active_achievements;
DROP POLICY IF EXISTS "Users write own active achievements" ON user_active_achievements;

CREATE POLICY "Users read own active achievements" ON user_active_achievements 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own active achievements" ON user_active_achievements 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. UPDATE USER_STORY_PROGRESS RLS
-- ============================================
DROP POLICY IF EXISTS "Users own story progress" ON user_story_progress;
CREATE POLICY "Users own story progress" ON user_story_progress 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collectibles_user_id ON user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_story_progress_user_id ON user_story_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

