-- ============================================================
-- Product Code column — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- A human-assigned product code / SKU shown and edited in the admin
-- product form and included in storefront search.
-- (Per-colour "color" is stored inside the existing color_variants jsonb,
--  so it needs no schema change.)
-- ============================================================

alter table products add column if not exists code text;
create index if not exists products_code_idx on products (code);

-- The storefront (anon) has column-level SELECT grants (see vendors-privacy.sql),
-- so the new column must be granted too or public queries get "permission denied".
grant select (code) on products to anon, authenticated;
