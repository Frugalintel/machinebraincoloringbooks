-- Reviews table for product ratings and comments
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, user_id) -- One review per user per product
);

-- Index for faster product review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public visibility)
CREATE POLICY "Public Read Reviews" ON reviews 
  FOR SELECT 
  USING (true);

-- Users can insert their own reviews
CREATE POLICY "Users Insert Own Reviews" ON reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users Update Own Reviews" ON reviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users Delete Own Reviews" ON reviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION get_product_rating(p_id UUID)
RETURNS TABLE(average_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE product_id = p_id;
END;
$$ LANGUAGE plpgsql;

-- View for product ratings (for easy querying)
CREATE OR REPLACE VIEW product_ratings AS
SELECT 
  product_id,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) as review_count
FROM reviews
GROUP BY product_id;
