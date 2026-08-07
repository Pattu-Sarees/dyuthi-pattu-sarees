-- ============================================================
-- Coupons — Phase 2 (user restrictions). Run ONCE in Supabase SQL editor.
-- Additive & idempotent.
-- ============================================================

alter table coupons add column if not exists per_user_limit      integer;                   -- null = unlimited per user
alter table coupons add column if not exists once_per_user       boolean not null default false;
alter table coupons add column if not exists new_users_only      boolean not null default false;
alter table coupons add column if not exists existing_users_only boolean not null default false;
alter table coupons add column if not exists allow_guests        boolean not null default true;

-- Helpful indexes for the per-user checks
create index if not exists coupon_redemptions_coupon_user_idx on coupon_redemptions(coupon_id, user_id);
create index if not exists orders_user_paid_idx on orders(user_id, payment_status);
