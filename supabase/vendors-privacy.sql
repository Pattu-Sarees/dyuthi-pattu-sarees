-- ============================================================
-- Procurement privacy — run this in Supabase SQL editor
-- (after vendors-module.sql).
--
-- Column-level protection: the storefront's public (anon) key can
-- no longer read vendor_id / purchase_cost / purchase_date /
-- invoice_number / procurement_notes, even by querying the Supabase
-- REST API directly. The admin panel is unaffected (service role).
--
-- NOTE: after this, public queries MUST list columns explicitly —
-- select('*') on products fails for anon/authenticated. The app code
-- uses PUBLIC_PRODUCT_COLUMNS (src/lib/public-product-columns.ts);
-- keep that list in sync with the grant below.
-- ============================================================

revoke select on table products from anon, authenticated;

grant select (
  id, name, description, price, original_price, images, category, fabric,
  color, color_variants, occasion, region, in_stock, stock_quantity,
  rating, review_count, is_featured, is_new_arrival, is_best_seller,
  status, sold_count, view_count, wishlist_count, slug, created_at, updated_at
) on products to anon, authenticated;
