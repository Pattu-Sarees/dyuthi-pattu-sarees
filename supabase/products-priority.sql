-- ============================================================
-- Product Priority column — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Optional admin-only ordering hint. Lower number = shown higher in the
-- admin Products list; products with no priority fall after prioritised ones.
-- NOT exposed to the storefront (absent from PUBLIC_PRODUCT_COLUMNS), so no
-- anon SELECT grant is required.
-- ============================================================

alter table products add column if not exists priority integer;
create index if not exists products_priority_idx on products (priority);
