-- Admin Dashboard Setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for admins table
DROP POLICY IF EXISTS "Admins can read admins" ON admins;
CREATE POLICY "Admins can read admins" ON admins
  FOR SELECT USING (is_admin());

-- ============================================
-- 2. PRODUCTS TABLE (Ensure existence)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  category TEXT,
  difficulty INTEGER DEFAULT 1,
  age TEXT,
  color TEXT,
  accent TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public Read Products" ON products;
CREATE POLICY "Public Read Products" ON products
  FOR SELECT USING (true);

-- Admin write
DROP POLICY IF EXISTS "Admin Write Products" ON products;
CREATE POLICY "Admin Write Products" ON products
  FOR ALL USING (is_admin());

-- ============================================
-- 3. ORDERS & ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT, -- For guest checkout
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'cancelled'
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL, -- Price at time of purchase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users read their own
DROP POLICY IF EXISTS "Users read own orders" ON orders;
CREATE POLICY "Users read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own order items" ON order_items;
CREATE POLICY "Users read own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Admins read all
DROP POLICY IF EXISTS "Admins read all orders" ON orders;
CREATE POLICY "Admins read all orders" ON orders
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins read all order items" ON order_items;
CREATE POLICY "Admins read all order items" ON order_items
  FOR ALL USING (is_admin());

-- ============================================
-- 4. ADMIN LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create_product', 'update_order', etc.
  target_resource TEXT, -- 'products', 'orders'
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read logs" ON admin_logs;
CREATE POLICY "Admins read logs" ON admin_logs
  FOR SELECT USING (is_admin());

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_resource TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_resource, target_id, details)
  VALUES (auth.uid(), p_action, p_resource, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ADMIN NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL, -- 'order', 'stock', 'system'
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read notifications" ON admin_notifications;
CREATE POLICY "Admins read notifications" ON admin_notifications
  FOR ALL USING (is_admin());

-- Trigger to notify on new order
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, message, link)
  VALUES ('order', 'New order received: ' || NEW.id, '/admin/orders/' || NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- ============================================
-- 6. ANALYTICS RPC
-- ============================================

-- Monthly Revenue (last 12 months)
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (month TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'Mon') as month,
    SUM(total_amount) as revenue
  FROM orders
  WHERE status = 'paid' AND created_at > (now() - INTERVAL '1 year')
  GROUP BY 1, date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily Revenue (last 30 days)
CREATE OR REPLACE FUNCTION get_daily_revenue()
RETURNS TABLE (date TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'YYYY-MM-DD') as date,
    SUM(total_amount) as revenue
  FROM orders
  WHERE status = 'paid' AND created_at > (now() - INTERVAL '30 days')
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Orders by Category (requires join)
CREATE OR REPLACE FUNCTION get_orders_by_category()
RETURNS TABLE (category TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(oi.id) as count
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'paid'
  GROUP BY p.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Realtime (Conditional drop)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders, admin_notifications;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE orders, admin_notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
END $$;
