-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public Read Stories" ON stories;
DROP POLICY IF EXISTS "Admin Write Stories" ON stories;

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone to read stories (public)
CREATE POLICY "Public Read Stories" ON stories
  FOR SELECT
  USING (true);

-- 2. Allow authenticated users (admins) to do EVERYTHING (Insert, Update, Delete)
CREATE POLICY "Admin All Stories" ON stories
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

