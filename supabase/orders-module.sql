-- ============================================================
-- Orders module — run this in Supabase SQL editor.
-- Additive & idempotent. Lets admin create manual (walk-in / WhatsApp)
-- orders that have no registered user account.
-- ============================================================

-- Manual orders may have no auth user, address or online payment
alter table orders alter column user_id drop not null;
alter table orders alter column address drop not null;
alter table orders alter column payment_method drop not null;

-- Human-friendly order number + customer details for manual orders
alter table orders add column if not exists order_number text;
alter table orders add column if not exists customer_name text;
alter table orders add column if not exists customer_phone text;

-- Allow the "packed" status (keep old values for backward compatibility)
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','confirmed','packed','shipped','delivered','cancelled','processing','out_for_delivery','returned'));

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

-- keep updated_at fresh (reuses the function from leads-module.sql if present)
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
