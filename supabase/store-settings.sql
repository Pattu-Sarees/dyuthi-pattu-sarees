-- ============================================================
-- Store settings (single-row) — run in Supabase SQL editor.
-- Idempotent. Exactly one row is enforced by a boolean singleton key.
-- ============================================================

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
