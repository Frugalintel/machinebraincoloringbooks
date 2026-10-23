-- Lock down public.profiles.is_admin against self-grant.
--
-- Privilege columns found on prod profiles:
--   is_admin  -- the only privilege flag; this migration protects it
-- Score columns left self-editable (see FOLLOW-UPS):
--   total_xp, collector_score, achievement_score
-- Other columns (not privilege flags):
--   id, email, display_name, avatar_url, display_title, profile_frame,
--   created_at, updated_at
--
-- Defense in depth:
--   1. BEFORE INSERT OR UPDATE trigger forces is_admin = false on insert
--      and blocks is_admin changes on update unless the caller is
--      service_role, postgres/supabase_admin, or an existing admin
--      (OLD.is_admin or public.is_admin(), which reads committed/OLD state).
--   2. WITH CHECK (auth.uid() = id) on "Users update own profile".
--   3. Column-level INSERT/UPDATE grants for anon and authenticated that
--      omit is_admin. The only client .update() on profiles in src/ writes
--      total_xp (game-context), so those grants keep normal edits working.
--
-- Idempotent. Creates no tables. No extensions. No pg_cron.
-- Table-dependent statements no-op when public.profiles is missing so a
-- migrations-only local reset (login-attempts tables only) stays valid.

CREATE OR REPLACE FUNCTION public.protect_profiles_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  bypass boolean;
  existing_admin boolean;
BEGIN
  bypass :=
    current_user IN ('postgres', 'supabase_admin')
    OR coalesce(auth.role(), '') = 'service_role';

  IF TG_OP = 'INSERT' THEN
    IF NOT bypass THEN
      NEW.is_admin := false;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    existing_admin := coalesce(OLD.is_admin, false) OR public.is_admin();
    IF NOT (bypass OR existing_admin) THEN
      RAISE EXCEPTION 'permission denied: cannot change is_admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.protect_profiles_privilege_columns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_profiles_privilege_columns() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row on signup. Never copies is_admin or other privilege flags from user metadata.';

DO $migration$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'public.profiles does not exist; skipping table grants, policies, and trigger';
    RETURN;
  END IF;

  EXECUTE 'DROP TRIGGER IF EXISTS protect_profiles_privilege_columns ON public.profiles';
  EXECUTE $sql$
    CREATE TRIGGER protect_profiles_privilege_columns
      BEFORE INSERT OR UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.protect_profiles_privilege_columns()
  $sql$;

  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Users update own profile" ON public.profiles';
  EXECUTE $sql$
    CREATE POLICY "Users update own profile"
      ON public.profiles
      FOR UPDATE
      TO anon, authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)
  $sql$;

  EXECUTE 'DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles';
  EXECUTE $sql$
    CREATE POLICY "Users insert own profile"
      ON public.profiles
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (auth.uid() = id)
  $sql$;

  EXECUTE 'DROP POLICY IF EXISTS "Public profiles" ON public.profiles';
  EXECUTE $sql$
    CREATE POLICY "Public profiles"
      ON public.profiles
      FOR SELECT
      TO anon, authenticated
      USING (true)
  $sql$;

  EXECUTE 'REVOKE ALL ON TABLE public.profiles FROM PUBLIC';
  EXECUTE 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.profiles FROM anon, authenticated';
  EXECUTE 'GRANT SELECT ON TABLE public.profiles TO anon, authenticated';
  EXECUTE 'GRANT ALL ON TABLE public.profiles TO service_role';
  EXECUTE $sql$
    GRANT INSERT (
      id,
      email,
      display_name,
      avatar_url,
      total_xp,
      collector_score,
      achievement_score,
      display_title,
      profile_frame,
      created_at,
      updated_at
    ) ON TABLE public.profiles TO anon, authenticated
  $sql$;
  EXECUTE $sql$
    GRANT UPDATE (
      email,
      display_name,
      avatar_url,
      total_xp,
      collector_score,
      achievement_score,
      display_title,
      profile_frame,
      updated_at
    ) ON TABLE public.profiles TO anon, authenticated
  $sql$;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE $sql$
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user()
    $sql$;
  END IF;
END;
$migration$;
