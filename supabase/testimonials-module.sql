-- ============================================================
-- Testimonials module — run this ONCE in the Supabase SQL editor.
-- Non-destructive: only creates a new table, its RLS policy, and a
-- trigger. Touches no existing tables or data.
-- ============================================================

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  review_text text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  purchased_product text,
  review_source text not null default 'Manual Entry',   -- WhatsApp | Instagram | Website | Manual Entry
  avatar_initial text,                                   -- optional override; defaults to first letter of name
  is_verified_buyer boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table testimonials enable row level security;

-- Storefront reads only active testimonials publicly.
create policy "testimonials_public_select" on testimonials for select using (is_active = true);

-- The public (anon) role must be granted SELECT for the RLS policy to apply —
-- without this the storefront gets "permission denied" and shows no reviews.
grant select on testimonials to anon, authenticated;

-- Reuses the existing set_updated_at() function (already defined by the homepage module).
create trigger testimonials_set_updated_at before update on testimonials
  for each row execute function set_updated_at();
