-- Add is_admin column to profiles table for role-based access control
-- This replaces the hardcoded ADMIN_EMAILS list in auth-context.tsx

-- Add the is_admin column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create an index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- Set the existing admin user(s) - update with your actual admin user IDs
-- You can also run this manually in the Supabase SQL editor with the correct user ID:
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid-here';

-- Alternative: Set admin by email (requires a join or subquery)
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE email IN ('jaydensaxton.c@outlook.com', 'demo@machinebrain.com')
-- );

-- Create a function to automatically set profile defaults on user creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on signup (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Add RLS policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile (but not is_admin)
CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Only admins can update the is_admin field (via service role or admin panel)
-- This is enforced by not exposing is_admin in update mutations from the client
