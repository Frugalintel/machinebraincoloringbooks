-- Runtime proof that a regular authenticated user cannot flip is_admin
-- and can still update normal profile fields.
--
-- CI does not run this file: GitHub Actions only runs lint, type-check,
-- vitest, and next build. There is no local Supabase or pgTAP job.
-- After applying supabase/migrations/20261023184500_protect_profiles_privilege_columns.sql
-- to a local or staging database (never prod), run:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/protect_profiles_privilege_columns.sql

BEGIN;

DO $probe$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles is required to run this test';
  END IF;
  IF to_regprocedure('public.protect_profiles_privilege_columns()') IS NULL THEN
    RAISE EXCEPTION 'protect_profiles_privilege_columns() is required to run this test';
  END IF;
END;
$probe$;

DO $fixture$
DECLARE
  test_id constant uuid := '00000000-0000-4000-8000-000000000099';
BEGIN
  DELETE FROM public.profiles WHERE id = test_id;
  INSERT INTO public.profiles (id, email, display_name, is_admin, total_xp)
  VALUES (test_id, 'privilege-guard@example.com', 'before', false, 1);
END;
$fixture$;

SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

DO $deny_update$
BEGIN
  UPDATE public.profiles
  SET is_admin = true
  WHERE id = '00000000-0000-4000-8000-000000000099';

  RAISE EXCEPTION 'expected is_admin update to be denied';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%cannot change%' OR SQLSTATE = '42501' THEN
      NULL;
    ELSE
      RAISE;
    END IF;
END;
$deny_update$;

UPDATE public.profiles
SET display_name = 'after', total_xp = 2
WHERE id = '00000000-0000-4000-8000-000000000099';

DO $assert_update$
DECLARE
  got record;
BEGIN
  SELECT display_name, total_xp, is_admin
  INTO STRICT got
  FROM public.profiles
  WHERE id = '00000000-0000-4000-8000-000000000099';

  IF got.display_name IS DISTINCT FROM 'after' OR got.total_xp IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'normal profile field update did not succeed';
  END IF;
  IF got.is_admin IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'is_admin must stay false after a denied privilege update';
  END IF;
END;
$assert_update$;

RESET ROLE;

DO $reset_row$
BEGIN
  DELETE FROM public.profiles WHERE id = '00000000-0000-4000-8000-000000000099';
END;
$reset_row$;

SET LOCAL ROLE authenticated;

DO $deny_insert$
DECLARE
  got_admin boolean;
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    '00000000-0000-4000-8000-000000000099',
    'privilege-guard@example.com',
    true
  );

  SELECT is_admin
  INTO STRICT got_admin
  FROM public.profiles
  WHERE id = '00000000-0000-4000-8000-000000000099';

  IF got_admin IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'insert must force is_admin = false';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
  WHEN raise_exception THEN
    IF SQLERRM LIKE '%cannot change%' OR SQLSTATE = '42501' THEN
      NULL;
    ELSE
      RAISE;
    END IF;
END;
$deny_insert$;

INSERT INTO public.profiles (id, email, display_name, total_xp)
VALUES (
  '00000000-0000-4000-8000-000000000099',
  'privilege-guard@example.com',
  'inserted',
  3
);

DO $assert_insert$
DECLARE
  got record;
BEGIN
  SELECT display_name, total_xp, is_admin
  INTO STRICT got
  FROM public.profiles
  WHERE id = '00000000-0000-4000-8000-000000000099';

  IF got.display_name IS DISTINCT FROM 'inserted' OR got.total_xp IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'normal profile insert did not succeed';
  END IF;
  IF got.is_admin IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'insert must force is_admin = false';
  END IF;
END;
$assert_insert$;

ROLLBACK;
