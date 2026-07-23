-- ============================================================
-- Products enhancements — run in Supabase SQL editor.
-- Additive & idempotent.
-- ============================================================

alter table products add column if not exists status text not null default 'active';
alter table products add column if not exists sold_count integer not null default 0;
alter table products add column if not exists view_count integer not null default 0;
alter table products add column if not exists wishlist_count integer not null default 0;
alter table products add column if not exists slug text;

create index if not exists products_status_idx on products (status);

-- Backfill a slug from the name where missing
update products
set slug = lower(regexp_replace(coalesce(name, ''), '[^a-z0-9]+', '-', 'gi'))
where slug is null or slug = '';

-- Atomic counter helpers (safe under concurrency)
create or replace function increment_view_count(pid uuid) returns void as $$
  update products set view_count = view_count + 1 where id = pid;
$$ language sql;

create or replace function increment_wishlist(pid uuid, delta int) returns void as $$
  update products set wishlist_count = greatest(0, wishlist_count + delta) where id = pid;
$$ language sql;

create or replace function increment_sold(pid uuid, qty int) returns void as $$
  update products set sold_count = sold_count + qty where id = pid;
$$ language sql;
