-- ============================================================
-- Adds customer email to orders (checkout + admin manual orders).
-- Non-destructive: one nullable column. Run once in the SQL editor.
-- ============================================================

alter table orders add column if not exists customer_email text;
