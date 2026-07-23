// Columns of `products` that are safe to send to the storefront.
// Procurement data (vendor_id, purchase_cost, purchase_date, invoice_number,
// procurement_notes) is admin-only and must NEVER be selected in public
// queries — these props end up serialized into the page HTML.
// Keep in sync with supabase/vendors-module.sql column grants.
export const PUBLIC_PRODUCT_COLUMNS =
  'id,name,description,price,original_price,images,category,fabric,color,color_variants,occasion,region,in_stock,stock_quantity,rating,review_count,is_featured,is_new_arrival,is_best_seller,status,sold_count,view_count,wishlist_count,slug,created_at,updated_at'

// The product detail page also needs the opening video. Kept separate because
// it's only used there, and so a pre-migration DB (column absent) can fall back.
export const PUBLIC_PRODUCT_VIDEO_COLUMNS = `${PUBLIC_PRODUCT_COLUMNS},video_url`
export const PUBLIC_PRODUCT_DETAIL_COLUMNS = `${PUBLIC_PRODUCT_COLUMNS},video_url,video_watermark`
