-- Manual "Best Seller" flag for products, mirroring is_new_arrival.
-- Run this in the Supabase SQL editor.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
