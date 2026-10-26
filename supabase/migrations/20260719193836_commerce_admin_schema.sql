-- Orders, promo codes, campaigns, settings, admin logs/notifications, analytics RPCs

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admins manage order items" ON order_items FOR ALL USING (is_admin());

-- PROMO CODES
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active promo codes" ON promo_codes FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admin manage promo codes" ON promo_codes FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active campaigns" ON campaigns FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admin manage campaigns" ON campaigns FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION activate_campaign(target_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns SET is_active = false;
  UPDATE campaigns SET is_active = true WHERE id = target_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admin Write Settings" ON system_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ADMIN LOGS
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_resource TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access logs" ON admin_logs FOR ALL USING (is_admin());

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

-- ADMIN NOTIFICATIONS
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notifications" ON admin_notifications FOR ALL USING (is_admin());

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

-- ANALYTICS RPCs
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (month TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(created_at, 'Mon') as month, SUM(total_amount) as revenue
  FROM orders
  WHERE status = 'paid' AND created_at > (now() - INTERVAL '1 year')
  GROUP BY 1, date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_revenue()
RETURNS TABLE (date TEXT, revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT to_char(created_at, 'YYYY-MM-DD') as date, SUM(total_amount) as revenue
  FROM orders
  WHERE status = 'paid' AND created_at > (now() - INTERVAL '30 days')
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_orders_by_category()
RETURNS TABLE (category TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.category, COUNT(oi.id) as count
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'paid'
  GROUP BY p.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders, admin_notifications, campaigns;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE orders, admin_notifications, campaigns;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
