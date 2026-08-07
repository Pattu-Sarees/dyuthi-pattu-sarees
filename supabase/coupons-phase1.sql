-- ============================================================
-- Coupons — Phase 1 (redemption engine). Run ONCE in Supabase SQL editor.
-- Additive & idempotent. Adds daily-usage + redemption tracking and an
-- atomic redeem function. No public policies → server-only (service role).
-- ============================================================

alter table coupons add column if not exists max_daily_uses integer;   -- null = unlimited
alter table coupons add column if not exists description   text;       -- customer-visible line

alter table orders  add column if not exists coupon_code    text;
-- discount_amount already exists on orders.

create table if not exists coupon_daily_usage (
  coupon_id  uuid not null references coupons(id) on delete cascade,
  usage_date date not null,
  count      integer not null default 0,
  primary key (coupon_id, usage_date)
);
alter table coupon_daily_usage enable row level security; -- no public policies

create table if not exists coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references coupons(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  user_id         uuid,
  discount_amount numeric not null default 0,
  status          text not null default 'redeemed' check (status in ('redeemed','reversed')),
  created_at      timestamptz not null default now()
);
create index if not exists coupon_redemptions_coupon_idx on coupon_redemptions(coupon_id);
create index if not exists coupon_redemptions_order_idx  on coupon_redemptions(order_id);
alter table coupon_redemptions enable row level security; -- no public policies

-- Atomically claim one redemption (global + daily) respecting both caps.
-- Returns true if claimed, false if a cap was already reached (caller then
-- decides whether to honour an already-paid order). SECURITY DEFINER so it runs
-- with the function owner's rights; only called from the server (service role).
create or replace function redeem_coupon(
  p_coupon uuid, p_total_limit integer, p_daily_limit integer, p_day date
) returns boolean language plpgsql security definer as $$
begin
  update coupons set used_count = used_count + 1, updated_at = now()
   where id = p_coupon and (p_total_limit is null or used_count < p_total_limit);
  if not found then return false; end if;

  if p_daily_limit is null then
    insert into coupon_daily_usage(coupon_id, usage_date, count) values (p_coupon, p_day, 1)
      on conflict (coupon_id, usage_date) do update set count = coupon_daily_usage.count + 1;
    return true;
  end if;

  insert into coupon_daily_usage(coupon_id, usage_date, count) values (p_coupon, p_day, 1)
    on conflict (coupon_id, usage_date)
      do update set count = coupon_daily_usage.count + 1
      where coupon_daily_usage.count < p_daily_limit;
  if not found then
    update coupons set used_count = greatest(0, used_count - 1) where id = p_coupon; -- roll back global
    return false;
  end if;
  return true;
end $$;
