-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create story analytics table
CREATE TABLE IF NOT EXISTS story_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'start', 'node_complete', 'choice', 'complete', 'abandon'
  node_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for analytics
ALTER TABLE story_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
-- Allowing all authenticated users to view analytics for now (matching local dev pattern)
-- In production, you might want to restrict this further
CREATE POLICY "Admins can view all analytics" ON story_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own analytics" ON story_analytics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
