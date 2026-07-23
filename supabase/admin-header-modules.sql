-- ============================================================
-- Admin header modules: notifications, activity_logs, product_views
-- Run in Supabase SQL editor. Additive & idempotent.
-- ============================================================

-- ---------- Notifications ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,          -- new_order | new_lead | low_stock | order_cancelled | inventory_adjustment
  title text not null,
  body text,
  link text,                   -- admin route to open on click
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_read_idx on notifications (is_read, created_at desc);
alter table notifications enable row level security;
-- Read/written via the service-role admin client only.

-- ---------- Activity logs ----------
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text,
  action text not null,        -- product_created | product_updated | inventory_adjusted | order_created | order_status_changed | lead_converted | category_created
  entity text,                 -- product | order | lead | category | inventory
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on activity_logs (created_at desc);
create index if not exists activity_logs_action_idx on activity_logs (action);
alter table activity_logs enable row level security;

-- ---------- Product views (session-based view tracking) ----------
create table if not exists product_views (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists product_views_product_idx on product_views (product_id);
create index if not exists product_views_created_idx on product_views (created_at desc);
alter table product_views enable row level security;
-- Allow the public storefront to record a view
drop policy if exists "product_views_public_insert" on product_views;
create policy "product_views_public_insert" on product_views for insert with check (true);

-- ---------- Helpful indexes for aggregation performance ----------
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists leads_status_idx on leads (status);
create index if not exists order_items_product_idx on order_items (product_id);
