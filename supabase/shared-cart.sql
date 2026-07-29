-- ============================================================
-- Shared cart module — run this in Supabase SQL editor.
-- Additive & idempotent. Mirrors shared_wishlists.
--
-- Stores a snapshot of a shopper's selected cart items so it can be
-- shared via a short code URL: /cart/share/<code>.
-- `items` holds [{ product_id, image, quantity }], resolved to live
-- products when the shared page is rendered.
-- ============================================================

create table if not exists shared_carts (
  code text primary key,
  owner_name text not null default 'My',
  items jsonb not null default '[]'::jsonb,
  user_id uuid,               -- set for logged-in owners: one stable link per user
  items_hash text,            -- set for anonymous shares: dedupe identical item sets
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_carts_created_idx on shared_carts (created_at desc);
-- One row per logged-in owner (stable, always-current link).
create unique index if not exists shared_carts_user_idx on shared_carts (user_id) where user_id is not null;
-- One row per distinct item set among anonymous shares (content dedupe).
create unique index if not exists shared_carts_hash_idx on shared_carts (items_hash) where user_id is null and items_hash is not null;

alter table shared_carts enable row level security;

-- Anyone (anon) may read a shared cart by its code — the code is the secret.
drop policy if exists "shared_carts_public_read" on shared_carts;
create policy "shared_carts_public_read"
  on shared_carts for select
  using (true);

-- Writes go through the service-role API only; no public insert/update policy.
