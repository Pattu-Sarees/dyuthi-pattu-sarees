-- ============================================================
-- Custom colours — run this in Supabase SQL editor.
-- Additive & idempotent.
--
-- A shared palette of admin-created colours (blended from names like
-- "blueish pink"). Managed via the service-role admin API only.
-- `hex` is null when the name couldn't be blended (shown as an "✕" swatch).
-- ============================================================

create table if not exists custom_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text,
  created_at timestamptz not null default now()
);

create index if not exists custom_colors_created_idx on custom_colors (created_at desc);

alter table custom_colors enable row level security;
-- No public policy: read/written only through the service-role admin API.
