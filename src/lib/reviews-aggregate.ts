import type { SupabaseClient } from '@supabase/supabase-js'

// Recompute and store a product's rating + review_count from its APPROVED
// reviews (testimonials rows carrying a product_id). Call this after a review
// is approved, rejected, edited, deleted, or created so the product columns
// stay in sync — the product grid and "Top Rated" sorting read these columns.
export async function recomputeProductRating(admin: SupabaseClient, productId: string | null | undefined) {
  if (!productId) return
  const { data } = await admin
    .from('testimonials')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')
  const ratings = (data || []).map((r: { rating: number }) => Number(r.rating)).filter((n) => n > 0)
  const count = ratings.length
  const avg = count ? ratings.reduce((a, b) => a + b, 0) / count : 0
  await admin
    .from('products')
    .update({ rating: Math.round(avg * 10) / 10, review_count: count })
    .eq('id', productId)
}
