import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { searchTextPattern, buildFallbackSearchOr, normalizeSearch } from '@/lib/product-search'
import { toDisplayItems, filterItemsForColorSearch, DisplayItem } from '@/components/products/displayItems'
import { Product } from '@/types'

type Params = Record<string, string | string[]>
// Minimal shape we need from the Supabase query builder (avoids a hard type dep).
type Query = {
  ilike: (c: string, p: string) => Query
  or: (f: string) => Query
  in: (c: string, v: string[]) => Query
  gte: (c: string, v: number) => Query
  lte: (c: string, v: number) => Query
  gt: (c: string, v: number) => Query
  eq: (c: string, v: unknown) => Query
  not: (c: string, op: string, v: unknown) => Query
  order: (c: string, o: { ascending: boolean; nullsFirst?: boolean }) => Query
  range: (from: number, to: number) => Promise<{ data: unknown; error: unknown; count: number | null }>
}

/** Apply the same filters/sort the listing has always used (kept in parity). */
function applyFilters(query: Query, params: Params, mode: 'search_text' | 'fallback', skipPriority = false): Query {
  const search = params.search as string
  if (mode === 'search_text') {
    const pattern = searchTextPattern(search)
    if (pattern) query = query.ilike('search_text', pattern)
  } else {
    const or = buildFallbackSearchOr(search)
    if (or) query = query.or(or)
  }

  const category = params.category
  if (category) query = query.in('category', Array.isArray(category) ? category : [category])

  const fabric = params.fabric
  if (fabric) query = query.in('fabric', Array.isArray(fabric) ? fabric : [fabric])

  const priceMin = params.price_min as string
  const priceMax = params.price_max as string
  if (priceMin) query = query.gte('price', Number(priceMin))
  if (priceMax) query = query.lte('price', Number(priceMax))

  if (params.availability === 'in_stock') query = query.gt('stock_quantity', 0)
  if (params.availability === 'out_of_stock') query = query.eq('stock_quantity', 0)
  if (params.in_stock === 'true') query = query.eq('in_stock', true)
  if (params.is_featured === 'true') query = query.eq('is_featured', true)
  if (params.is_new_arrival === 'true') query = query.eq('is_new_arrival', true)
  if (params.is_best_seller === 'true') query = query.eq('is_best_seller', true)
  if (params.on_sale === 'true') query = query.not('original_price', 'is', null)

  // Exclude inactive products IN SQL so range pagination stays consistent.
  query = query.or('status.is.null,status.neq.inactive')

  const sort = params.sort as string
  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'rating': query = query.order('rating', { ascending: false }); break
    case 'popular': query = query.order('review_count', { ascending: false }); break
    case 'name_asc': query = query.order('name', { ascending: true }); break
    case 'name_desc': query = query.order('name', { ascending: false }); break
    case 'date_asc': query = query.order('created_at', { ascending: true }); break
    case 'date_desc': query = query.order('created_at', { ascending: false }); break
    // Default: manual Priority (lowest number first) — but ONLY on the plain
    // "All Collections" listing. The New Arrivals / Best Sellers / On Sale rails
    // keep their newest-first order. Products without a priority fall to the end,
    // then newest first as a tiebreaker. `skipPriority` also avoids ordering by
    // priority if that column hasn't been added to the DB yet.
    default: {
      const isSpecialRail =
        params.is_new_arrival === 'true' || params.is_best_seller === 'true' || params.on_sale === 'true'
      if (!skipPriority && !isSpecialRail) query = query.order('priority', { ascending: true, nullsFirst: false })
      query = query.order('created_at', { ascending: false })
    }
  }
  return query
}

/** Fetch matching products (capped) for card-based infinite scroll. */
export async function fetchAllProducts(
  supabase: { from: (t: string) => { select: (c: string, o?: { count: 'exact' }) => Query } },
  params: Params,
  cap = 200
): Promise<Product[]> {
  const run = (mode: 'search_text' | 'fallback', skipPriority = false) =>
    applyFilters(supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS), params, mode, skipPriority).range(0, cap - 1)
  let res = await run('search_text')
  if (res.error && normalizeSearch(params.search as string)) res = await run('fallback')
  // If ordering failed (e.g. the `priority` column hasn't been added yet),
  // retry without priority so the storefront never goes blank.
  if (res.error) res = await run('search_text', true)
  if (res.error && normalizeSearch(params.search as string)) res = await run('fallback', true)
  if (res.error) return []
  return (res.data as Product[]) || []
}

/** Flatten products into display cards, applying colour/pin/badge item filters. */
export function productsToItems(products: Product[], params: Params): DisplayItem[] {
  let items = toDisplayItems(products)
  items = filterItemsForColorSearch(items, params.search as string)
  const pinned = params.item as string | undefined
  if (pinned) items = items.filter((it) => it.key === pinned)
  if (params.is_new_arrival === 'true') items = items.filter((it) => it.isNewArrival)
  if (params.is_best_seller === 'true') items = items.filter((it) => it.isBestSeller)
  return items
}

export function computeOnlyBadge(params: Params): 'best' | 'new' | 'sale' | undefined {
  return params.is_best_seller === 'true' ? 'best'
    : params.is_new_arrival === 'true' ? 'new'
    : params.on_sale === 'true' ? 'sale'
    : undefined
}
