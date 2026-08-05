-- ============================================================
-- Product Priority column — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Manual ordering hint. Lower number = shown first. Used to order the
-- storefront "All Collections" page. Because products has column-level SELECT
-- grants (see vendors-privacy.sql), the anon/authenticated roles MUST be granted
-- SELECT on this column too — otherwise ordering by it fails with "permission
-- denied" and the storefront silently falls back to newest-first.
-- ============================================================

alter table products add column if not exists priority integer;
create index if not exists products_priority_idx on products (priority);

-- Required so the public storefront can ORDER BY priority.
grant select (priority) on products to anon, authenticated;
