-- ============================================================
-- FULL REST WRITE LOCKDOWN — run ONCE in the Supabase SQL editor.
--
-- After this, the public Supabase REST endpoint (anon key, used by the browser
-- AND by Postman/any REST tool) is effectively READ-ONLY. Every create / update
-- / delete now happens only through the server /api routes, which authenticate
-- the user and write with the service-role key.
--
-- SELECT policies are kept, so customers can still READ their own orders,
-- wishlist and profile, and the public can read products/approved reviews.
-- No UPDATE/DELETE policies exist on orders/reviews for the public role, so
-- those were already blocked.
-- ============================================================

-- Guarded so it runs cleanly even if some tables don't exist in this DB
-- (e.g. product_views / legacy reviews may never have been created).
do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'drop policy if exists "orders_insert" on orders';
  end if;
  if to_regclass('public.order_items') is not null then
    execute 'drop policy if exists "order_items_insert" on order_items';
  end if;
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists "profiles_insert" on profiles';
    execute 'drop policy if exists "profiles_update" on profiles';
  end if;
  if to_regclass('public.wishlist_collections') is not null then
    execute 'drop policy if exists "wishlist_collections_insert_own" on wishlist_collections';
    execute 'drop policy if exists "wishlist_collections_update_own" on wishlist_collections';
    execute 'drop policy if exists "wishlist_collections_delete_own" on wishlist_collections';
  end if;
  if to_regclass('public.product_views') is not null then
    execute 'drop policy if exists "product_views_public_insert" on product_views';
  end if;
  if to_regclass('public.reviews') is not null then
    execute 'drop policy if exists "reviews_insert" on reviews';
    execute 'drop policy if exists "reviews_update" on reviews';
  end if;
end $$;

-- ---- Verify: only *_select / read policies should remain for the public ----
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, cmd;
-- Any row with cmd = INSERT/UPDATE/DELETE for anon/authenticated means a write
-- path is still open — there should be none after this migration.
