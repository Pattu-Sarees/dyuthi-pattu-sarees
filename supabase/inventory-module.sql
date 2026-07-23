-- ============================================================
-- Inventory module — run this in Supabase SQL editor.
-- Additive & idempotent. Stock adjustments with an audit log.
-- ============================================================

-- Audit log of every stock change (manual adjustments, restocks, etc.)
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  change integer not null,                 -- signed delta (+restock, -shrinkage/sale)
  resulting_quantity integer not null,     -- stock_quantity after this movement
  reason text not null default 'adjustment',
  note text,
  created_by text,                         -- admin email
  created_at timestamptz not null default now()
);

-- Which colour/photo this movement applies to (null = whole-product adjustment)
alter table stock_movements add column if not exists variant_image text;

create index if not exists stock_movements_product_idx on stock_movements (product_id, created_at desc);

alter table stock_movements enable row level security;
-- Reads/writes go through the service-role admin client, so no public policy is needed.

-- Atomically adjust a product's stock by `delta`, clamp at 0, keep in_stock
-- in sync, and record a movement row. Returns the new stock quantity.
create or replace function adjust_stock(
  pid uuid,
  delta int,
  p_reason text default 'adjustment',
  p_note text default null,
  p_by text default null
) returns integer as $$
declare
  new_qty integer;
begin
  update products
    set stock_quantity = greatest(0, coalesce(stock_quantity, 0) + delta),
        in_stock = greatest(0, coalesce(stock_quantity, 0) + delta) > 0,
        updated_at = now()
    where id = pid
    returning stock_quantity into new_qty;

  if new_qty is null then
    raise exception 'Product % not found', pid;
  end if;

  insert into stock_movements (product_id, change, resulting_quantity, reason, note, created_by)
  values (pid, delta, new_qty, coalesce(p_reason, 'adjustment'), p_note, p_by);

  return new_qty;
end;
$$ language plpgsql;
