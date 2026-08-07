-- ============================================================
-- Product listing indexes — run this in the Supabase SQL editor.
-- Additive & idempotent — safe to run more than once.
--
-- The storefront listing (/products and the New Arrivals / Best Sellers /
-- On Sale / category / search pages) filters and sorts products on a fixed set
-- of columns. Without indexes, every listing query is a full sequential scan of
-- the products table — fine at a few hundred rows, but the single biggest source
-- of DB latency as the catalogue grows. These btree / partial indexes back the
-- exact filters and ORDER BYs used by src/lib/products-query.ts.
--
-- NOTE (large / live tables): a plain CREATE INDEX briefly locks writes on the
-- table. On a big production catalogue, run each statement with
-- CREATE INDEX CONCURRENTLY instead (one per statement, NOT inside a
-- transaction / BEGIN...COMMIT). On a small catalogue the plain form below is
-- instant and safe.
-- ============================================================

-- ---- Filters ----------------------------------------------------------------

-- category:  .in('category', [...])
create index if not exists products_category_idx
  on products (category);

-- fabric:    .in('fabric', [...])
create index if not exists products_fabric_idx
  on products (fabric);

-- price:     .gte('price', n) / .lte('price', n) + price_asc / price_desc sorts
create index if not exists products_price_idx
  on products (price);

-- stock:     availability filters (.gt / .eq on stock_quantity)
create index if not exists products_stock_quantity_idx
  on products (stock_quantity);

-- ---- Sort keys --------------------------------------------------------------

-- created_at: newest-first is the default tiebreaker on every listing + the
-- date_asc / date_desc sorts. DESC matches the common direction.
create index if not exists products_created_at_desc_idx
  on products (created_at desc);

-- rating:     sort=rating
create index if not exists products_rating_idx
  on products (rating desc);

-- review_count: sort=popular
create index if not exists products_review_count_idx
  on products (review_count desc);

-- Default "All Collections" sort is priority (asc, nulls last) then created_at
-- (desc). A composite index serves that ORDER BY in one pass.
create index if not exists products_priority_created_idx
  on products (priority asc, created_at desc);

-- ---- Boolean / nullable flags (partial indexes) -----------------------------
-- Partial indexes only store the matching rows, so they stay tiny and are used
-- by the special-rail pages that filter on the flag being true / set.

-- is_new_arrival = true
create index if not exists products_new_arrival_idx
  on products (created_at desc) where is_new_arrival = true;

-- is_best_seller = true
create index if not exists products_best_seller_idx
  on products (created_at desc) where is_best_seller = true;

-- is_featured = true
create index if not exists products_featured_idx
  on products (created_at desc) where is_featured = true;

-- on_sale:  .not('original_price','is',null)  → rows that have a strike price
create index if not exists products_on_sale_idx
  on products (created_at desc) where original_price is not null;

-- status filter: the listing always excludes inactive rows
-- (status is null OR status <> 'inactive'). A partial index over the active set
-- keeps listing scans off the inactive rows.
create index if not exists products_active_created_idx
  on products (created_at desc)
  where status is null or status <> 'inactive';

-- Keep planner statistics fresh so it actually chooses the new indexes.
analyze products;
