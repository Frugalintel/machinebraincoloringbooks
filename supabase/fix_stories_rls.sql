-- Enable RLS on stories if not already enabled
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to insert, update, and delete stories
CREATE POLICY "Admin Write Stories" ON stories 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

