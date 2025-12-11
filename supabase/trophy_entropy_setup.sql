-- Trophy Entropy Setup
-- Adds last_polished_at column for tracking when users polish their trophies

ALTER TABLE user_collectibles ADD COLUMN IF NOT EXISTS last_polished_at TIMESTAMPTZ;

-- Create index for efficient queries on timestamps
CREATE INDEX IF NOT EXISTS idx_user_collectibles_timestamps 
ON user_collectibles(user_id, collected_at, last_polished_at);
