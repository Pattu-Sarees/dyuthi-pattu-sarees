-- ============================================================
-- Lock down direct order creation via the public API (Postman / REST).
-- Run ONCE in the Supabase SQL editor.
--
-- Orders and order_items are now created ONLY by the server (service-role)
-- inside /api/orders, which verifies the Razorpay payment signature and
-- recomputes the amount from real prices. Removing the public INSERT policies
-- means a signed-in user can no longer POST straight to /rest/v1/orders and
-- fabricate a "paid" order, an arbitrary amount, or someone else's order.
--
-- SELECT policies stay intact, so customers can still read THEIR OWN orders.
-- There are no UPDATE/DELETE policies on orders for the public role, so those
-- are already blocked. Admin changes go through the service role.
-- ============================================================

drop policy if exists "orders_insert" on orders;
drop policy if exists "order_items_insert" on order_items;

-- (Optional) The legacy public "reviews" table is unused by the app; product
-- reviews are inserted server-side into "testimonials". If you don't use it,
-- you may also remove its write policies:
-- drop policy if exists "reviews_insert" on reviews;
-- drop policy if exists "reviews_update" on reviews;

-- Verify afterwards (should list only *_select / own-scoped policies):
--   select schemaname, tablename, policyname, cmd
--   from pg_policies where tablename in ('orders','order_items') order by tablename;
