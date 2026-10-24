-- Optional per-book spec columns for /store and /store/[id].
--
-- Every column is nullable with no default, and this file writes no data:
-- the store drops a spec row when its column is null, so books read the same
-- before and after this runs until someone fills a value in.
--
--   page_count      pages in the printed book
--   trim_width_in   trim width, inches; with trim_height_in sets the cover aspect
--   trim_height_in  trim height, inches
--   paper           paper stock, as printed on the spec list
--   binding         binding, as printed on the spec list
--   title_lines     two-line mobile title; a newline marks the break
--
-- No GRANT or RLS changes: on prod, anon and authenticated hold table-level
-- SELECT on public.products, which covers new columns, and both policies
-- ("Public read published products", "Admin manage products") are row-level.
--
-- Idempotent. Applied by Store after review; not applied from this PR.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS page_count integer
    CHECK (page_count IS NULL OR page_count > 0),
  ADD COLUMN IF NOT EXISTS trim_width_in numeric(5, 2)
    CHECK (trim_width_in IS NULL OR trim_width_in > 0),
  ADD COLUMN IF NOT EXISTS trim_height_in numeric(5, 2)
    CHECK (trim_height_in IS NULL OR trim_height_in > 0),
  ADD COLUMN IF NOT EXISTS paper text,
  ADD COLUMN IF NOT EXISTS binding text,
  ADD COLUMN IF NOT EXISTS title_lines text;
