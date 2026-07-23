-- ============================================================
-- Orders: store phone country code separately — Supabase SQL editor.
-- Idempotent. customer_phone keeps the national number; the dialing
-- code (e.g. +91) is stored in customer_country_code.
-- ============================================================

alter table orders add column if not exists customer_country_code text default '+91';
