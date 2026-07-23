-- ============================================================
-- Coupons module — run this in Supabase SQL editor.
-- Additive & idempotent.
-- ============================================================

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent' check (discount_type in ('percent','flat')),
  discount_value numeric(10,2) not null check (discount_value >= 0),
  min_order_value numeric(10,2) not null default 0,
  expiry_date date,
  usage_limit integer,              -- null = unlimited
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coupons_code_idx on coupons (code);
create index if not exists coupons_active_idx on coupons (is_active);

alter table coupons enable row level security;
-- Public storefront can read active coupons (for validation at checkout)
drop policy if exists "coupons_public_select" on coupons;
create policy "coupons_public_select" on coupons for select using (is_active = true);

-- keep updated_at fresh (reuses set_updated_at() from orders-module.sql)
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists coupons_set_updated_at on coupons;
create trigger coupons_set_updated_at before update on coupons
  for each row execute function set_updated_at();
