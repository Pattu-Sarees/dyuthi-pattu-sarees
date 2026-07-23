-- ============================================================
-- Leads module — run this in Supabase SQL editor.
-- Additive & idempotent: safe to run on an existing `leads` table.
-- ============================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'website',
  status text not null default 'new',
  notes text,
  follow_up_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add the new columns if the table already existed
alter table leads add column if not exists source text not null default 'website';
alter table leads add column if not exists status text not null default 'new';
alter table leads add column if not exists notes text;
alter table leads add column if not exists follow_up_date date;
alter table leads add column if not exists updated_at timestamptz default now();

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_created_at_idx on leads (created_at desc);

-- Keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
