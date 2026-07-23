-- ============================================================
-- Shared wishlist module — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Stores a snapshot of a shopper's wishlist so it can be shared
-- via a short code URL: /wishlist/share/<code>.
-- `items` holds the wishlist keys (product_id or product_id::image),
-- resolved to live products when the shared page is rendered.
-- ============================================================

create table if not exists shared_wishlists (
  code text primary key,
  owner_name text not null default 'My',
  items jsonb not null default '[]'::jsonb,
  user_id uuid,               -- set for logged-in owners: one stable link per user
  items_hash text,            -- set for anonymous shares: dedupe identical item sets
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Older installs: add the new columns if the table already existed.
alter table shared_wishlists add column if not exists user_id uuid;
alter table shared_wishlists add column if not exists items_hash text;

create index if not exists shared_wishlists_created_idx on shared_wishlists (created_at desc);
-- One row per logged-in owner (stable, always-current link).
create unique index if not exists shared_wishlists_user_idx on shared_wishlists (user_id) where user_id is not null;
-- One row per distinct item set among anonymous shares (content dedupe).
create unique index if not exists shared_wishlists_hash_idx on shared_wishlists (items_hash) where user_id is null and items_hash is not null;

alter table shared_wishlists enable row level security;

-- Anyone (anon) may read a shared wishlist by its code — the code is the secret.
drop policy if exists "shared_wishlists_public_read" on shared_wishlists;
create policy "shared_wishlists_public_read"
  on shared_wishlists for select
  using (true);

-- Writes go through the service-role API only; no public insert/update policy.
