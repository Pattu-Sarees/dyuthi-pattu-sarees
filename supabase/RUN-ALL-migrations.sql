-- ============================================================
-- RUN ALL admin migrations in one go.
-- Paste this whole file into the Supabase SQL editor and click Run.
-- Additive & idempotent — safe to run more than once.
-- ============================================================

-- ===== 1) LEADS MODULE =====
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'website',
  status text not null default 'new',
  notes text,
  follow_up_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table leads add column if not exists source text not null default 'website';
alter table leads add column if not exists status text not null default 'new';
alter table leads add column if not exists notes text;
alter table leads add column if not exists follow_up_date date;
alter table leads add column if not exists updated_at timestamptz default now();
create index if not exists leads_status_idx on leads (status);
create index if not exists leads_created_at_idx on leads (created_at desc);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

-- ===== 2) ORDERS MODULE =====
alter table orders alter column user_id drop not null;
alter table orders alter column address drop not null;
alter table orders alter column payment_method drop not null;
alter table orders add column if not exists order_number text;
alter table orders add column if not exists customer_name text;
alter table orders add column if not exists customer_phone text;
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','confirmed','packed','shipped','delivered','cancelled','processing','out_for_delivery','returned'));
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();

-- ===== 3) PRODUCTS ENHANCEMENTS =====
alter table products add column if not exists status text not null default 'active';
alter table products add column if not exists sold_count integer not null default 0;
alter table products add column if not exists view_count integer not null default 0;
alter table products add column if not exists wishlist_count integer not null default 0;
alter table products add column if not exists slug text;
create index if not exists products_status_idx on products (status);

update products
set slug = lower(regexp_replace(coalesce(name, ''), '[^a-z0-9]+', '-', 'gi'))
where slug is null or slug = '';

create or replace function increment_view_count(pid uuid) returns void as $$
  update products set view_count = view_count + 1 where id = pid;
$$ language sql;

create or replace function increment_wishlist(pid uuid, delta int) returns void as $$
  update products set wishlist_count = greatest(0, wishlist_count + delta) where id = pid;
$$ language sql;

create or replace function increment_sold(pid uuid, qty int) returns void as $$
  update products set sold_count = sold_count + qty where id = pid;
$$ language sql;


-- ============================================================
-- Inventory module (stock_movements + adjust_stock)
-- ============================================================
-- Audit log of every stock change (manual adjustments, restocks, etc.)
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  change integer not null,                 -- signed delta (+restock, -shrinkage/sale)
  resulting_quantity integer not null,     -- stock_quantity after this movement
  reason text not null default 'adjustment',
  note text,
  created_by text,                         -- admin email
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on stock_movements (product_id, created_at desc);

alter table stock_movements enable row level security;
-- Reads/writes go through the service-role admin client, so no public policy is needed.

-- Atomically adjust a product's stock by `delta`, clamp at 0, keep in_stock
-- in sync, and record a movement row. Returns the new stock quantity.
create or replace function adjust_stock(
  pid uuid,
  delta int,
  p_reason text default 'adjustment',
  p_note text default null,
  p_by text default null
) returns integer as $$
declare
  new_qty integer;
begin
  update products
    set stock_quantity = greatest(0, coalesce(stock_quantity, 0) + delta),
        in_stock = greatest(0, coalesce(stock_quantity, 0) + delta) > 0,
        updated_at = now()
    where id = pid
    returning stock_quantity into new_qty;

  if new_qty is null then
    raise exception 'Product % not found', pid;
  end if;

  insert into stock_movements (product_id, change, resulting_quantity, reason, note, created_by)
  values (pid, delta, new_qty, coalesce(p_reason, 'adjustment'), p_note, p_by);

  return new_qty;
end;
$$ language plpgsql;


-- ============================================================
-- Coupons module
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


-- ============================================================
-- Homepage CMS module
-- ============================================================
create table if not exists homepage_sections (
  key text primary key,            -- announcement | hero | new_arrivals | best_sellers | on_sale | collection | footer
  enabled boolean not null default true,
  title text,
  subtitle text,
  images text[] not null default '{}',
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,   -- extras: announcement text, footer links, cta, etc.
  updated_at timestamptz not null default now()
);

alter table homepage_sections enable row level security;
-- Storefront reads sections publicly so changes reflect immediately
drop policy if exists "homepage_sections_public_select" on homepage_sections;
create policy "homepage_sections_public_select" on homepage_sections for select using (true);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists homepage_sections_set_updated_at on homepage_sections;
create trigger homepage_sections_set_updated_at before update on homepage_sections
  for each row execute function set_updated_at();

-- Seed the known sections (idempotent — won't overwrite existing edits)
insert into homepage_sections (key, title, subtitle, sort_order, data) values
  ('announcement', 'Free shipping across India', null, 0, '{"message":"✨ Free shipping on all orders ✨"}'),
  ('hero',         'Handwoven Elegance',          'Timeless handloom sarees', 1, '{}'),
  ('new_arrivals', 'New Arrivals',                'Fresh off the loom',       2, '{}'),
  ('best_sellers', 'Best Sellers',                'Loved by our customers',   3, '{}'),
  ('on_sale',      'On Sale',                     'Limited-time offers',      4, '{}'),
  ('collection',   'Our Collections',             'Explore by weave',         5, '{}'),
  ('footer',       'Dyuthi Pattu Sarees',         null,                       6, '{}')
on conflict (key) do nothing;


-- Inventory: per-colour movement support (idempotent)
alter table stock_movements add column if not exists variant_image text;


-- Orders: source/channel column (idempotent)
alter table orders add column if not exists source text not null default 'website';
create index if not exists orders_source_idx on orders (source);


-- Orders: allow pre-booking status (idempotent)
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','pre-booking','confirmed','packed','shipped','delivered','cancelled','processing','out_for_delivery','returned'));


-- Orders: phone country code column (idempotent)
alter table orders add column if not exists customer_country_code text default '+91';


-- Admin header modules: notifications, activity_logs, product_views
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


-- Store settings (single-row)
create table if not exists store_settings (
  id boolean primary key default true,
  -- Store information
  store_name text,
  support_mobile text,
  whatsapp_number text,
  business_email text,
  store_address text,
  -- Inventory
  low_stock_threshold integer not null default 3,
  -- Homepage
  announcement_text text,
  hero_banner_image text,
  show_best_sellers boolean not null default true,
  show_new_arrivals boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id)
);

-- Ensure the single row exists
insert into store_settings (id) values (true) on conflict (id) do nothing;

alter table store_settings enable row level security;
-- Public storefront reads these (footer, contact, announcement, etc.)
drop policy if exists "store_settings_public_read" on store_settings;
create policy "store_settings_public_read" on store_settings for select using (true);


-- ============================================================
-- Shared wishlist module (public share links)
-- ============================================================
create table if not exists shared_wishlists (
  code text primary key,
  owner_name text not null default 'My',
  items jsonb not null default '[]'::jsonb,
  user_id uuid,
  items_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table shared_wishlists add column if not exists user_id uuid;
alter table shared_wishlists add column if not exists items_hash text;
create index if not exists shared_wishlists_created_idx on shared_wishlists (created_at desc);
create unique index if not exists shared_wishlists_user_idx on shared_wishlists (user_id) where user_id is not null;
create unique index if not exists shared_wishlists_hash_idx on shared_wishlists (items_hash) where user_id is null and items_hash is not null;
alter table shared_wishlists enable row level security;
drop policy if exists "shared_wishlists_public_read" on shared_wishlists;
create policy "shared_wishlists_public_read" on shared_wishlists for select using (true);
-- Writes go through the service-role API only; no public insert/update policy.
create table if not exists wishlist_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  cover text,                       -- preview image url (snapshot at creation)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wishlist_collections_user_idx on wishlist_collections (user_id, created_at desc);

alter table wishlist_collections enable row level security;

-- Owner-only access (session carries auth.uid()).
drop policy if exists "wishlist_collections_select_own" on wishlist_collections;
create policy "wishlist_collections_select_own"
  on wishlist_collections for select using (auth.uid() = user_id);

drop policy if exists "wishlist_collections_insert_own" on wishlist_collections;
create policy "wishlist_collections_insert_own"
  on wishlist_collections for insert with check (auth.uid() = user_id);

drop policy if exists "wishlist_collections_update_own" on wishlist_collections;
create policy "wishlist_collections_update_own"
  on wishlist_collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wishlist_collections_delete_own" on wishlist_collections;
create policy "wishlist_collections_delete_own"
  on wishlist_collections for delete using (auth.uid() = user_id);

-- keep updated_at fresh (reuses set_updated_at() from earlier migrations)
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists wishlist_collections_set_updated_at on wishlist_collections;
create trigger wishlist_collections_set_updated_at before update on wishlist_collections
  for each row execute function set_updated_at();

