-- Fix Admin Logs and Permissions
-- Run this in your Supabase SQL Editor

-- 1. SEED ADMINS (Critical Step: Connects Auth Users to Admin Role)
-- This inserts your user into the 'admins' table so is_admin() returns true.
INSERT INTO admins (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IN (
  'jaydensaxton.c@outlook.com', 
  'jayden@example.com', 
  'demo@machinebrain.com'
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Update Admin Check Function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is in admins table
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix Admin Logs RLS
-- Allow admins to do everything (Read, Insert, etc) on logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins read logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins full access logs" ON admin_logs;

CREATE POLICY "Admins full access logs" ON admin_logs
  FOR ALL USING (is_admin());

-- 4. Update Logging Function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_resource TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_resource, target_id, details)
  VALUES (auth.uid(), p_action, p_resource, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
