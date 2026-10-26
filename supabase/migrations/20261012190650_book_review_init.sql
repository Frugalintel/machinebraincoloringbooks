insert into storage.buckets (id, name, public, file_size_limit) values ('book-review','book-review', false, 52428800) on conflict (id) do update set public=false;

create table if not exists public.book_review_submissions (
  id uuid primary key default gen_random_uuid(),
  book_slug text not null,
  version int not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (book_slug, version)
);
create index if not exists book_review_submissions_slug_idx on public.book_review_submissions (book_slug, version desc);

revoke all on table public.book_review_submissions from anon, authenticated;
grant select, insert, update, delete on table public.book_review_submissions to service_role;

alter table public.book_review_submissions enable row level security;
drop policy if exists book_review_submissions_service_all on public.book_review_submissions;
create policy book_review_submissions_service_all on public.book_review_submissions
  for all to service_role using (true) with check (true);
