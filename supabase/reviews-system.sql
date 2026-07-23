-- ============================================================
-- Review Management System — run ONCE in the Supabase SQL editor.
-- Extends the existing `testimonials` table into the unified review
-- store (customer submissions + admin manual entries).
-- Non-destructive: only adds nullable columns and indexes.
--
-- Workflow columns:
--   status    : 'pending' | 'approved' | 'rejected'  (admin approval)
--   is_active : public visibility switch — the RLS policy already
--               filters on it, so approval sets it true and
--               pending/rejected keep it false. Existing rows stay live.
-- ============================================================

alter table testimonials add column if not exists customer_email  text;
alter table testimonials add column if not exists customer_mobile text;
alter table testimonials add column if not exists location        text;
alter table testimonials add column if not exists order_id        uuid;
alter table testimonials add column if not exists product_id      uuid;
alter table testimonials add column if not exists review_title    text;
alter table testimonials add column if not exists review_images   text[] not null default '{}';
alter table testimonials add column if not exists is_featured     boolean not null default false;
alter table testimonials add column if not exists status          text not null default 'approved';

-- One review per delivered order (order_id is null for manual/product reviews)
create unique index if not exists testimonials_order_id_uidx on testimonials (order_id) where order_id is not null;
create index if not exists testimonials_product_id_idx on testimonials (product_id) where product_id is not null;
create index if not exists testimonials_status_idx on testimonials (status);
create index if not exists testimonials_featured_idx on testimonials (is_featured) where is_featured;
