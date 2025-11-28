-- Fix RLS policies to ensure users can redeem codes and save progress

-- 1. Allow users to insert their own codes
DROP POLICY IF EXISTS "Users own codes" ON user_codes;
CREATE POLICY "Users own codes" ON user_codes FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to insert/update their own story progress
DROP POLICY IF EXISTS "Users own story progress" ON user_story_progress;
CREATE POLICY "Users own story progress" ON user_story_progress FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to insert their own collectibles
DROP POLICY IF EXISTS "Users own collectibles" ON user_collectibles;
CREATE POLICY "Users own collectibles" ON user_collectibles FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure book codes are readable by authenticated users (to validate)
DROP POLICY IF EXISTS "Authenticated Read Book Codes" ON book_codes;
CREATE POLICY "Authenticated Read Book Codes" ON book_codes FOR SELECT 
USING (auth.role() = 'authenticated');

