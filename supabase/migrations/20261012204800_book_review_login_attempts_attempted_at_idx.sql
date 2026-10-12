create index if not exists book_review_login_attempts_attempted_at_idx
  on public.book_review_login_attempts (attempted_at desc);
