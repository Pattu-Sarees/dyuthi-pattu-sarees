-- ============================================================
-- Homepage CMS module — run this in Supabase SQL editor.
-- Additive & idempotent. One row per homepage section.
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
