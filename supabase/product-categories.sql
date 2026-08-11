-- ============================================================
-- Product Categories — admin-managed category list.
-- Run this in the Supabase SQL editor. Additive & idempotent.
--
-- Replaces the hard-coded category list in code with a table the admin can
-- add / edit / delete from the dashboard. Drives:
--   • the product form's Category dropdown
--   • admin product category validation
--   • the storefront "All Collections" mega menu (grouped, alphabetical)
--
-- NOTE: this is NOT the carousel `categories` table (home-page category tiles).
-- That one is intentionally left untouched — this is a separate concern.
--
--   slug        — stable key stored on products.category (keeps existing
--                 product→category links working; matches the old code slugs).
--   menu_group  — which mega-menu column it appears under.
-- ============================================================

create table if not exists product_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  menu_group  text not null default 'Sarees',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Public storefront needs to read categories (menu + listing).
alter table product_categories enable row level security;

drop policy if exists "product_categories public read" on product_categories;
create policy "product_categories public read"
  on product_categories for select
  using (true);

grant select on product_categories to anon, authenticated;

-- Seed the existing categories so nothing breaks. ON CONFLICT (slug) keeps this
-- safe to re-run and won't clobber edits made later in the admin.
insert into product_categories (name, slug, menu_group) values
  ('Mangalgiri',          'mangalgiri',          'Sarees'),
  ('Kuppadam',            'kuppadam',            'Sarees'),
  ('Mangalgiri Kuppadam', 'mangalgiri kuppadam', 'Sarees'),
  ('Gadwal Pattu',        'gadwal pattu',        'Sarees'),
  ('Gadwal Cotton',       'gadwal cotton',       'Sarees'),
  ('Kota',                'kota',                'Sarees'),
  ('Kanchipattu',         'kanchipattu',         'Sarees'),
  ('Soft Silks',          'soft silks',          'Sarees'),
  ('Jamdhani',            'jamdhani',            'Other Sarees'),
  ('Butter Silk',         'butter silk',         'Other Sarees'),
  ('Green Mango',         'green mango',         'Other Sarees'),
  ('Lehengas',            'lehengas',            'Lehengas'),
  ('Dress Materials',     'dress materials',     'Dress Materials')
on conflict (slug) do nothing;
