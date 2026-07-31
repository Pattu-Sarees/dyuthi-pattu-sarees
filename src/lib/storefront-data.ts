import { unstable_cache } from 'next/cache'
import { createAnonClient } from '@/lib/supabase/anon'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
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
      let q = db.from('products').select(PUBLIC_PRODUCT_COLUMNS).order('created_at', { ascending: false }).limit(60)
      if (category) q = q.eq('category', category)
      const { data, error } = await q
      if (error) return []
      return ((data || []) as Product[]).filter((p) => (p.status ?? 'active') !== 'inactive')
    },
    ['home-collection', category || 'all'],
    { revalidate: REVALIDATE, tags: ['products'] }
  )()
}
