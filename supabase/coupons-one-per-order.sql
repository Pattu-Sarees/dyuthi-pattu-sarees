-- ============================================================
-- Enforce ONE coupon redemption per order at the database level.
-- Run ONCE in Supabase SQL editor. (order_id may be null for orphaned rows —
-- Postgres treats nulls as distinct, so multiple nulls are allowed.)
-- ============================================================

alter table coupon_redemptions
  add constraint uniq_redemption_per_order unique (order_id);
