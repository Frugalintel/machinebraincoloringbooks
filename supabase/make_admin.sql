-- Make specific user(s) an admin
-- Run this in Supabase SQL Editor

-- Option 1: Set admin by email (most common)
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'jaydensaxton.c@outlook.com'
);

-- Option 2: Set admin by user ID (if you know the UUID)
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid-here';

-- Verify the update worked
SELECT 
  p.id,
  u.email,
  p.display_name,
  p.is_admin
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE;
