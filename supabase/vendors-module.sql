-- ============================================================
-- Vendors module — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Vendor master + product procurement columns. Products store
-- vendor_id (FK) so future reports (products/inventory/purchase
-- value/profit by vendor) can join on it.
-- ============================================================

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null unique,
  notes text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_status_idx on vendors (status);
create index if not exists vendors_name_idx on vendors (vendor_name);

alter table vendors enable row level security;
-- No public policies: vendors are admin-only (accessed via service role).

-- keep updated_at fresh (reuses set_updated_at() from orders-module.sql)
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists vendors_set_updated_at on vendors;
create trigger vendors_set_updated_at before update on vendors
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Product procurement columns
-- ------------------------------------------------------------
alter table products add column if not exists vendor_id uuid references vendors (id) on delete set null;
alter table products add column if not exists purchase_cost numeric(10,2);
alter table products add column if not exists purchase_date date;
alter table products add column if not exists invoice_number text;
alter table products add column if not exists procurement_notes text;

-- For vendor-wise reporting (products by vendor, purchase value, etc.)
create index if not exists products_vendor_idx on products (vendor_id);
