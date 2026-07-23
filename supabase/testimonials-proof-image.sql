-- ============================================================
-- Adds an optional "review proof" screenshot to testimonials.
-- Non-destructive: only adds one nullable column. Existing rows
-- keep working (proof_image stays NULL).
-- Run once in the Supabase SQL editor.
-- ============================================================

alter table testimonials add column if not exists proof_image text;
