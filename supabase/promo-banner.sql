-- ============================================================
-- Offer Banner (thin promo bar below the header). Run ONCE in Supabase.
-- Seeds the 'promo' homepage section. Starts DISABLED — enable it from
-- /admin → Homepage → Offer Banner when offers are live.
-- ============================================================

insert into homepage_sections (key, enabled, sort_order, data)
values (
  'promo',
  false,
  1,
  jsonb_build_object('message', '🧵 Direct From Weavers · 🚚 Free Shipping · ✨ Exclusive Sravanam Offers · 🎁 Save Up to ₹300')
)
on conflict (key) do nothing;
