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

-- =====================================================
-- ADMIN-ONLY POLICIES (Security Hardening)
-- =====================================================

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Products: Only admins can modify, everyone can read published
DROP POLICY IF EXISTS "Public read published products" ON products;
CREATE POLICY "Public read published products" ON products FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Admin manage products" ON products FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 6. Collectibles: Only admins can create/modify
DROP POLICY IF EXISTS "Public read collectibles" ON collectibles;
CREATE POLICY "Public read collectibles" ON collectibles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin manage collectibles" ON collectibles;
CREATE POLICY "Admin manage collectibles" ON collectibles FOR INSERT
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin update collectibles" ON collectibles;
CREATE POLICY "Admin update collectibles" ON collectibles FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin delete collectibles" ON collectibles;
CREATE POLICY "Admin delete collectibles" ON collectibles FOR DELETE
USING (is_admin());

-- 7. Stories: Only admins can modify
DROP POLICY IF EXISTS "Public read published stories" ON stories;
CREATE POLICY "Public read published stories" ON stories FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admin manage stories" ON stories;
CREATE POLICY "Admin manage stories" ON stories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 8. Story nodes: Only admins can modify
DROP POLICY IF EXISTS "Public read story nodes" ON story_nodes;
CREATE POLICY "Public read story nodes" ON story_nodes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin manage story nodes" ON story_nodes;
CREATE POLICY "Admin manage story nodes" ON story_nodes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 9. Campaigns: Only admins can modify
DROP POLICY IF EXISTS "Public read active campaigns" ON campaigns;
CREATE POLICY "Public read active campaigns" ON campaigns FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage campaigns" ON campaigns;
CREATE POLICY "Admin manage campaigns" ON campaigns FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 10. Admin logs: Only admins can read/write
DROP POLICY IF EXISTS "Admin access logs" ON admin_logs;
CREATE POLICY "Admin access logs" ON admin_logs FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 11. Settings: Only admins can modify, everyone reads
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings" ON settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin manage settings" ON settings;
CREATE POLICY "Admin manage settings" ON settings FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 12. Book codes: Only admins can create/modify
DROP POLICY IF EXISTS "Admin manage book codes" ON book_codes;
CREATE POLICY "Admin manage book codes" ON book_codes FOR INSERT
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin update book codes" ON book_codes;
CREATE POLICY "Admin update book codes" ON book_codes FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin delete book codes" ON book_codes;
CREATE POLICY "Admin delete book codes" ON book_codes FOR DELETE
USING (is_admin());
