-- ============================================================
-- Product opening video — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Stores a single video URL per product (hosted on Cloudflare R2,
-- YouTube, etc.). Public/safe to expose — it's meant to be watched.
-- ============================================================

alter table products add column if not exists video_url text;

-- Public storefront reads this column, so grant it to the anon/authenticated
-- roles alongside the other public columns (matches vendors-privacy.sql grant).
grant select (video_url) on products to anon, authenticated;
