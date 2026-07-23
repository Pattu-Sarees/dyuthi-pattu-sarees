-- ============================================================
-- Wishlist Collections module — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- Lets a logged-in shopper group wishlist items into named
-- collections (Myntra-style). Storefront reads/writes directly
-- with the anon key under the user's session, so RLS scopes
-- every row to its owner (auth.uid()).
-- `items` holds wishlist keys (product_id or product_id::image).
-- ============================================================

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
