-- Fix advisor findings
-- 1. product_ratings view should run as invoker
ALTER VIEW public.product_ratings SET (security_invoker = true);

-- 2. Lock down function search paths
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.log_admin_action(text, text, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.notify_new_order() SET search_path = public;
ALTER FUNCTION public.get_monthly_revenue() SET search_path = public;
ALTER FUNCTION public.get_daily_revenue() SET search_path = public;
ALTER FUNCTION public.get_orders_by_category() SET search_path = public;
ALTER FUNCTION public.get_product_rating(uuid) SET search_path = public;
ALTER FUNCTION public.activate_campaign(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Anonymous users should not execute admin/definer functions
REVOKE EXECUTE ON FUNCTION public.activate_campaign(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_monthly_revenue() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_daily_revenue() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_orders_by_category() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated;
