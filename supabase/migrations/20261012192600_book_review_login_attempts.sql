CREATE TABLE public.book_review_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX book_review_login_attempts_ip_hash_attempted_at_idx
  ON public.book_review_login_attempts (ip_hash, attempted_at DESC);

ALTER TABLE public.book_review_login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_review_login_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.book_review_login_attempts FROM anon;
REVOKE ALL ON TABLE public.book_review_login_attempts FROM authenticated;
GRANT ALL ON TABLE public.book_review_login_attempts TO service_role;

CREATE POLICY service_role_all_book_review_login_attempts
  ON public.book_review_login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
