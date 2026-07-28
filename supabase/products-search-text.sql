-- ============================================================
-- Product search_text — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- A lower-cased text column combining the FOUR searchable fields (name, code,
-- category, colour) — and only those four. Storefront search does a single
-- case-insensitive ilike on it, so keyword/partial matches work across all of
-- them — including colour, which is a text[] and can't be ilike'd directly, so
-- a fragment like "peach" matches the colour "Pink Peach".
--
-- Maintained by a trigger (not a GENERATED column): array_to_string() isn't
-- accepted in a generated expression ("generation expression is not immutable",
-- 42P17), and a trigger keeps search_text in sync on every insert/update anyway.
-- ============================================================

alter table products add column if not exists search_text text;

-- Recompute search_text from the row's own fields.
create or replace function products_search_text_sync()
returns trigger
language plpgsql
as $$
begin
  new.search_text :=
    lower(
      coalesce(new.name, '') || ' ' ||
      coalesce(new.code, '') || ' ' ||
      coalesce(new.category, '') || ' ' ||
      coalesce(array_to_string(new.color, ' '), '')
    );
  return new;
end;
$$;

drop trigger if exists products_search_text_trg on products;
create trigger products_search_text_trg
  before insert or update on products
  for each row execute function products_search_text_sync();

-- Backfill existing rows once.
update products set search_text =
  lower(
    coalesce(name, '') || ' ' ||
    coalesce(code, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(array_to_string(color, ' '), '')
  );

-- Trigram index so the leading-wildcard ilike ('%peach%') stays fast as the
-- catalogue grows. Safe to skip on tiny catalogues, but harmless to keep.
create extension if not exists pg_trgm;
create index if not exists products_search_text_trgm
  on products using gin (search_text gin_trgm_ops);

-- Storefront (anon) has column-level grants — grant the new column too.
grant select (search_text) on products to anon, authenticated;
