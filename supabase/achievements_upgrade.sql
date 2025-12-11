-- Add rarity and custom_color columns to achievements table
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'Common',
ADD COLUMN IF NOT EXISTS custom_color TEXT;

-- Add check constraint for rarity values (optional but good practice)
-- DO NOT ADD CONSTRAINT if you want flexibility, but for a game system, consistency is key.
-- For now, let's keep it flexible as text.

