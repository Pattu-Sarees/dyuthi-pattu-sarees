-- ============================================================
-- Orders: allow the 'pre-booking' status — run in Supabase SQL editor.
-- Idempotent.
-- ============================================================

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','pre-booking','confirmed','packed','shipped','delivered','cancelled','processing','out_for_delivery','returned'));
