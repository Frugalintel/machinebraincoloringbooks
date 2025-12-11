-- Collectibles Setup
-- Run this migration to create the collectibles and collection_sets tables

-- Collection Sets table (parent table for grouping collectibles)
CREATE TABLE IF NOT EXISTS collection_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reward TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collectibles table
CREATE TABLE IF NOT EXISTS collectibles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    requirement TEXT,
    lore TEXT,
    rarity TEXT DEFAULT 'Common' CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
    type TEXT,
    generation TEXT,
    found_in TEXT,
    set_id UUID REFERENCES collection_sets(id) ON DELETE SET NULL,
    related_achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collectibles_set_id ON collectibles(set_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_rarity ON collectibles(rarity);
CREATE INDEX IF NOT EXISTS idx_collectibles_related_achievement ON collectibles(related_achievement_id);

-- Enable RLS
ALTER TABLE collection_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_sets

-- Allow public read access
CREATE POLICY "collection_sets_public_read" ON collection_sets
    FOR SELECT
    USING (true);

-- Allow admins to insert
CREATE POLICY "collection_sets_admin_insert" ON collection_sets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Allow admins to update
CREATE POLICY "collection_sets_admin_update" ON collection_sets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Allow admins to delete
CREATE POLICY "collection_sets_admin_delete" ON collection_sets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for collectibles

-- Allow public read access
CREATE POLICY "collectibles_public_read" ON collectibles
    FOR SELECT
    USING (true);

-- Allow admins to insert
CREATE POLICY "collectibles_admin_insert" ON collectibles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Allow admins to update
CREATE POLICY "collectibles_admin_update" ON collectibles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Allow admins to delete
CREATE POLICY "collectibles_admin_delete" ON collectibles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to collection_sets
DROP TRIGGER IF EXISTS update_collection_sets_updated_at ON collection_sets;
CREATE TRIGGER update_collection_sets_updated_at
    BEFORE UPDATE ON collection_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to collectibles
DROP TRIGGER IF EXISTS update_collectibles_updated_at ON collectibles;
CREATE TRIGGER update_collectibles_updated_at
    BEFORE UPDATE ON collectibles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
