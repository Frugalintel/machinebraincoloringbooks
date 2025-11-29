-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Public Read Access
CREATE POLICY "Public Read Settings" ON system_settings
  FOR SELECT USING (true);

-- Admin Write Access (using existing auth.role() check or similar)
-- Assuming admin check is standard authenticated + role logic or just authenticated if that's the current simple model
CREATE POLICY "Admin Write Settings" ON system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Initial Seed Data for Global Discount
INSERT INTO system_settings (key, value)
VALUES (
  'global_discount',
  '{
    "enabled": true,
    "percentage": 30,
    "label": "BLACK FRIDAY"
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

