-- Full Setup Script (Safe to re-run)

-- 1. Tables
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  target_value INTEGER DEFAULT 1,
  is_secret BOOLEAN DEFAULT false,
  trigger_type TEXT,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  cover_url TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  rewards JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS book_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  unlocks_type TEXT NOT NULL,
  unlocks_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES book_codes(id) ON DELETE CASCADE,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, code_id)
);

CREATE TABLE IF NOT EXISTS user_story_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_node_id TEXT,
  completed_nodes JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, story_id)
);

-- 2. RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;

-- Read Access
DROP POLICY IF EXISTS "Public Read Achievements" ON achievements;
CREATE POLICY "Public Read Achievements" ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Stories" ON stories;
CREATE POLICY "Public Read Stories" ON stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Read Book Codes" ON book_codes;
CREATE POLICY "Authenticated Read Book Codes" ON book_codes FOR SELECT USING (auth.role() = 'authenticated');

-- Write Access (User)
DROP POLICY IF EXISTS "Users own codes" ON user_codes;
CREATE POLICY "Users own codes" ON user_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own story progress" ON user_story_progress;
CREATE POLICY "Users own story progress" ON user_story_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Data Seeding
-- Stories
INSERT INTO stories (title, synopsis, content, requirements, is_published) VALUES
('The Signal', 'A strange transmission received from Sector 7.', '[]'::jsonb, '[]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Test Code
DO $$
DECLARE
  story_id UUID;
BEGIN
  SELECT id INTO story_id FROM stories WHERE title = 'The Signal' LIMIT 1;
  IF story_id IS NOT NULL THEN
    INSERT INTO book_codes (code, unlocks_type, unlocks_id, is_active)
    VALUES ('TEST-SIGNAL', 'story', story_id, true)
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

