-- 1. book_codes: page_number + kind (additive)
alter table public.book_codes add column if not exists page_number integer;
alter table public.book_codes add column if not exists kind text not null default 'page';

do $$ begin
  if not exists (select 1 from pg_constraint where conname='book_codes_kind_check' and conrelid='public.book_codes'::regclass) then
    alter table public.book_codes add constraint book_codes_kind_check check (kind in ('page','book'));
  end if;
end $$;

create unique index if not exists book_codes_product_page_uidx on public.book_codes (product_id, page_number) where product_id is not null and page_number is not null;
create unique index if not exists book_codes_one_book_per_product_uidx on public.book_codes (product_id) where kind = 'book' and product_id is not null;

-- 2. register_book RPC (authenticated only)
create or replace function public.register_book(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_uid uuid := auth.uid();
  v_code_id uuid;
  v_product uuid;
  v_inserted integer;
begin
  if v_uid is null then
    return jsonb_build_object('status','unauthenticated');
  end if;
  select id, product_id into v_code_id, v_product
    from public.book_codes
   where code = btrim(p_code) and is_active and kind = 'book'
   limit 1;
  if v_code_id is null or v_product is null then
    return jsonb_build_object('status','invalid');
  end if;
  insert into public.user_books (user_id, product_id)
    values (v_uid, v_product)
    on conflict (user_id, product_id) do nothing;
  get diagnostics v_inserted = row_count;
  insert into public.user_codes (user_id, code_id)
    values (v_uid, v_code_id)
    on conflict (user_id, code_id) do nothing;
  return jsonb_build_object('status', case when v_inserted > 0 then 'registered' else 'already_registered' end, 'product_id', v_product);
end;
$fn$;

revoke all on function public.register_book(text) from public;
revoke all on function public.register_book(text) from anon;
grant execute on function public.register_book(text) to authenticated;

-- 3. lock down user_books writes (app only reads this table; register_book writes it)
revoke all on table public.user_books from anon;
revoke insert, delete, truncate, update, references, trigger on table public.user_books from authenticated;
grant select on table public.user_books to authenticated;
drop policy if exists "Users own books" on public.user_books;
drop policy if exists "Users read own books" on public.user_books;
create policy "Users read own books" on public.user_books for select to authenticated using (auth.uid() = user_id);

-- 4. TEST book (unpublished, price 0) + codes
insert into public.products (title, subtitle, description, price, category, is_published, pages)
select '[TEST] QA Scan Book — do not buy', 'QA test product', 'Throwaway product for QA scan/register testing. Not for sale.', 0, 'test', false, 10
where not exists (select 1 from public.products where title = '[TEST] QA Scan Book — do not buy');

insert into public.book_codes (code, product_id, unlocks_type, unlocks_id, is_active, page_number, kind)
select 'QA-TEST-BOOK', p.id, 'test', null, true, null, 'book'
from public.products p where p.title = '[TEST] QA Scan Book — do not buy'
on conflict (code) do nothing;

insert into public.book_codes (code, product_id, unlocks_type, unlocks_id, is_active, page_number, kind)
select 'QA-TEST-P' || lpad(n::text, 2, '0'), p.id, 'test', null, true, n, 'page'
from public.products p, generate_series(1,10) n
where p.title = '[TEST] QA Scan Book — do not buy'
on conflict (code) do nothing;
