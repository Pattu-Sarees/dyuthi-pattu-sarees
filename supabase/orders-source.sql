-- ============================================================
-- Orders: source/channel column — run in Supabase SQL editor.
-- Additive & idempotent. Tracks online (website) vs offline
-- (whatsapp/instagram/facebook/phone/walk-in) orders.
-- ============================================================

alter table orders add column if not exists source text not null default 'website';

create index if not exists orders_source_idx on orders (source);
