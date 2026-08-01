-- ============================================================
-- Fix: approved reviews not showing on the storefront ("Customer Diaries").
-- Run ONCE in the Supabase SQL editor.
--
-- The public RLS policy on `testimonials` exposes rows only when
-- is_active = true. Reviews approved before the approval workflow set
-- is_active (or imported/seeded rows) can be status='approved' yet
-- is_active=false — visible in admin (service role) but hidden publicly.
-- This backfills the visibility flag so every approved review goes live.
-- Idempotent & safe.
-- ============================================================

update testimonials
set is_active = true
where status = 'approved' and is_active is not true;
