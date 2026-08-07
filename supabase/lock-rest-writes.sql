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

-- Orders — created only by /api/orders (payment verified, amount server-computed)
drop policy if exists "orders_insert" on orders;
drop policy if exists "order_items_insert" on order_items;

-- Profile — updated only by /api/account/profile
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;

-- Wishlist collections — created/updated/deleted only by /api/wishlist/collections
drop policy if exists "wishlist_collections_insert_own" on wishlist_collections;
drop policy if exists "wishlist_collections_update_own" on wishlist_collections;
drop policy if exists "wishlist_collections_delete_own" on wishlist_collections;

-- Product-view counter — incremented only by the server RPC (service role)
drop policy if exists "product_views_public_insert" on product_views;

-- Legacy public "reviews" table is unused (app writes to "testimonials" server-side)
drop policy if exists "reviews_insert" on reviews;
drop policy if exists "reviews_update" on reviews;

-- ---- Verify: only *_select / read policies should remain for the public ----
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, cmd;
-- Any row with cmd = INSERT/UPDATE/DELETE for anon/authenticated means a write
-- path is still open — there should be none after this migration.
