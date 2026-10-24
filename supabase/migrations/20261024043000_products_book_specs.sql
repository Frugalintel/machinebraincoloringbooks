-- Optional per-book spec columns for /store and /store/[id].
--
-- Names match the sample catalogue (data/books.sample.json). Every column is
-- nullable with no default, and this file writes no data: the store drops a
-- spec row when its column is null, so books read the same before and after
-- this runs until someone fills a value in.
--
--   pages     page count
--   sides     "single" when the book is printed single-sided
--   trim      trim as printed, e.g. "8.5 × 11 in"; the cover aspect parses it
--   binding   binding, as printed on the spec list
--   detail    detail on the catalogue's 5-point scale
--   lines     two-line title; a newline marks the break (the sample file's array)
--
-- products.age already exists, so it is not added here.
--
-- No GRANT or RLS changes: on prod, anon and authenticated hold table-level
-- SELECT on public.products, which covers new columns, and both policies
-- ("Public read published products", "Admin manage products") are row-level.
--
-- Idempotent. Applied by Store after review; not applied from this PR.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS pages integer
    CHECK (pages IS NULL OR pages > 0),
  ADD COLUMN IF NOT EXISTS sides text,
  ADD COLUMN IF NOT EXISTS trim text,
  ADD COLUMN IF NOT EXISTS binding text,
  ADD COLUMN IF NOT EXISTS detail integer
    CHECK (detail IS NULL OR detail > 0),
  ADD COLUMN IF NOT EXISTS lines text;
