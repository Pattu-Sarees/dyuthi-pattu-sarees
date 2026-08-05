import { unstable_cache } from 'next/cache'
import { createAnonClient } from '@/lib/supabase/anon'
import { PUBLIC_PRODUCT_COLUMNS, PUBLIC_PRODUCT_VIDEO_COLUMNS, PUBLIC_PRODUCT_DETAIL_COLUMNS } from '@/lib/public-product-columns'
import { fetchAllProducts } from '@/lib/products-query'
import { Product, Testimonial } from '@/types'

// Public storefront data is the same for everyone, so cache it briefly instead
// of re-querying Supabase on every navigation. 60s keeps admin edits fresh
// within a minute while eliminating repeated DB round-trips (the nav lag fix).
const REVALIDATE = 60

export const getFeaturedProducts = unstable_cache(
  async () => {
    const db = createAnonClient()
    const [newArrivals, bestSellers, onSale] = await Promise.all([
      db.from('products').select(PUBLIC_PRODUCT_COLUMNS).eq('is_new_arrival', true).order('created_at', { ascending: false }).limit(40),
      db.from('products').select(PUBLIC_PRODUCT_COLUMNS).eq('is_best_seller', true).order('created_at', { ascending: false }).limit(40),
      db.from('products').select(PUBLIC_PRODUCT_COLUMNS).not('original_price', 'is', null).order('created_at', { ascending: false }).limit(40),
    ])
    return {
      newArrivals: (newArrivals.data || []) as Product[],
      bestSellers: (bestSellers.data || []) as Product[],
      onSale: (onSale.data || []) as Product[],
    }
  },
  ['home-featured'],
  { revalidate: REVALIDATE, tags: ['products'] }
)

export const getCategoriesCached = unstable_cache(
  async () => {
    const db = createAnonClient()
    const { data, error } = await db.from('categories').select('*').order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return null // caller falls back to defaults
    return data.map((c: { name: string; slug: string; image: string }) => ({ name: c.name, slug: c.slug, img: c.image }))
  },
  ['home-categories'],
  { revalidate: REVALIDATE, tags: ['categories'] }
)

export const getTestimonialsCached = unstable_cache(
  async () => {
    const db = createAnonClient()
    const { data, error } = await db
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(24)
    if (error) return []
    return (data || []) as Testimonial[]
  },
  ['home-testimonials'],
  { revalidate: REVALIDATE, tags: ['testimonials'] }
)

/**
 * Products for the home "Our Collection" grid. Filtered by category IN SQL and
 * capped at 60 (the grid shows only 10 + "View All"), instead of fetching the
 * entire products table and filtering in JS.
 */
export function getCollectionProducts(category?: string) {
  return unstable_cache(
    async () => {
      const db = createAnonClient()
      let q = db.from('products').select(PUBLIC_PRODUCT_COLUMNS)
        .order('priority', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(60)
      if (category) q = q.eq('category', category)
      const { data, error } = await q
      if (error) return []
      return ((data || []) as Product[]).filter((p) => (p.status ?? 'active') !== 'inactive')
    },
    ['home-collection', category || 'all'],
    { revalidate: REVALIDATE, tags: ['products'] }
  )()
}

/**
 * Cached listing products for /products (and category/search pages).
 * Cookie-free anon read wrapped in unstable_cache, keyed by the filter params —
 * so repeat navigations to a collection skip the DB round-trip. This is the
 * main mobile navigation-latency fix for the listing pages.
 */
export function getListingProducts(params: Record<string, string | string[]>) {
  return unstable_cache(
    async () => {
      const db = createAnonClient()
      return fetchAllProducts(db as never, params)
    },
    ['listing', JSON.stringify(params)],
    { revalidate: REVALIDATE, tags: ['products'] }
  )()
}

export interface ProductReview {
  id: string; user_name: string; rating: number; title: string | null
  comment: string; images: string[]; verified: boolean; created_at: string
}

/**
 * Cached product-detail data (product + approved reviews) by id. Cookie-free
 * anon read — makes Collection→Product / Wishlist→Product fast on mobile.
 */
export function getProductPage(id: string) {
  return unstable_cache(
    async (): Promise<{ product: Product | null; reviews: ProductReview[] }> => {
      const db = createAnonClient()
      let product: Product | null = null
      for (const cols of [PUBLIC_PRODUCT_DETAIL_COLUMNS, PUBLIC_PRODUCT_VIDEO_COLUMNS, PUBLIC_PRODUCT_COLUMNS]) {
        const { data } = await db.from('products').select(cols).eq('id', id).single()
        if (data) { product = data as unknown as Product; break }
      }
      if (!product) return { product: null, reviews: [] }

      const { data } = await db
        .from('testimonials')
        .select('id, customer_name, rating, review_title, review_text, review_images, is_verified_buyer, created_at')
        .eq('product_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20)

      const reviews: ProductReview[] = (data || []).map((r) => ({
        id: r.id as string,
        user_name: r.customer_name as string,
        rating: r.rating as number,
        title: (r.review_title as string) || null,
        comment: r.review_text as string,
        images: (r.review_images as string[]) || [],
        verified: !!r.is_verified_buyer,
        created_at: r.created_at as string,
      }))
      return { product, reviews }
    },
    ['product-page', id],
    { revalidate: REVALIDATE, tags: ['products'] }
  )()
}
