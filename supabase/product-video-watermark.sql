-- ============================================================
-- Product video watermark — run this in Supabase SQL editor.
-- Additive & idempotent. Stores the on-site overlay text
-- (defaults to the website URL) shown over the product video.
-- ============================================================

alter table products add column if not exists video_watermark text;

grant select (video_watermark) on products to anon, authenticated;
