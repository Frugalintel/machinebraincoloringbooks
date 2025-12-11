DROP FUNCTION IF EXISTS activate_campaign(UUID);
DROP TABLE IF EXISTS campaigns CASCADE;

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to active campaign" ON campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access to campaigns" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated'); 

-- Function to activate a campaign
CREATE OR REPLACE FUNCTION activate_campaign(target_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all campaigns
  UPDATE campaigns SET is_active = false;
  
  -- Activate the target campaign
  UPDATE campaigns SET is_active = true WHERE id = target_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: Move existing settings from system_settings to campaigns
DO $$
DECLARE
  existing_settings JSONB;
BEGIN
  SELECT value INTO existing_settings FROM system_settings WHERE key = 'global_discount';
  
  IF existing_settings IS NOT NULL THEN
    INSERT INTO campaigns (name, is_active, settings)
    VALUES (
      COALESCE(existing_settings->>'label', existing_settings->>'name', 'Default Campaign'),
      COALESCE((existing_settings->>'enabled')::boolean, (existing_settings->>'isActive')::boolean, false),
      existing_settings
    );
  END IF;
END $$;

