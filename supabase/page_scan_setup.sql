-- Create page_scans table
CREATE TABLE IF NOT EXISTS page_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID REFERENCES book_codes(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for page_scans
ALTER TABLE page_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans" ON page_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans" ON page_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for page scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-scans', 'page-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload scan images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'page-scans');

CREATE POLICY "Users can view scan images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'page-scans');

CREATE POLICY "Public Access to Scans" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'page-scans');

