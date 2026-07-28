import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { Product } from '@/types'
import InfiniteProductsGrid from './InfiniteProductsGrid'
import { toDisplayItems, filterItemsForColorSearch } from './displayItems'
import { searchTextPattern, buildFallbackSearchOr, normalizeSearch } from '@/lib/product-search'

async function getProducts(searchParams: Record<string, string | string[]>) {
  const supabase = await createClient()
  const search = searchParams.search as string

  const buildQuery = (mode: 'search_text' | 'fallback') => {
    let query = supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS)
    if (mode === 'search_text') {
      const pattern = searchTextPattern(search)
      if (pattern) query = query.ilike('search_text', pattern)
    } else {
      const or = buildFallbackSearchOr(search)
      if (or) query = query.or(or)
    }

  const category = searchParams.category
  if (category) {
    const cats = Array.isArray(category) ? category : [category]
    query = query.in('category', cats)
  }

  const fabric = searchParams.fabric
  if (fabric) {
    const fabrics = Array.isArray(fabric) ? fabric : [fabric]
    query = query.in('fabric', fabrics)
  }

  const priceMin = searchParams.price_min as string
  const priceMax = searchParams.price_max as string
  if (priceMin) query = query.gte('price', Number(priceMin))
  if (priceMax) query = query.lte('price', Number(priceMax))

  if (searchParams.availability === 'in_stock') query = query.gt('stock_quantity', 0)
  if (searchParams.availability === 'out_of_stock') query = query.eq('stock_quantity', 0)
  if (searchParams.in_stock === 'true') query = query.eq('in_stock', true)
  if (searchParams.is_featured === 'true') query = query.eq('is_featured', true)
  if (searchParams.is_new_arrival === 'true') query = query.eq('is_new_arrival', true)
  if (searchParams.is_best_seller === 'true') query = query.eq('is_best_seller', true)
  if (searchParams.on_sale === 'true') query = query.not('original_price', 'is', null)

  const sort = searchParams.sort as string
  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'rating': query = query.order('rating', { ascending: false }); break
    case 'popular': query = query.order('review_count', { ascending: false }); break
    case 'name_asc': query = query.order('name', { ascending: true }); break
    case 'name_desc': query = query.order('name', { ascending: false }); break
    case 'date_asc': query = query.order('created_at', { ascending: true }); break
    case 'date_desc': query = query.order('created_at', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

    return query.limit(2000)
  }

  // Prefer the generated search_text column (full-phrase match incl. colour);
  // fall back to the migration-free builder if that column isn't present yet.
  let { data, error } = await buildQuery('search_text')
  if (error && normalizeSearch(search)) {
    ;({ data, error } = await buildQuery('fallback'))
  }
  if (error) return []
  return (data as Product[]).filter((p) => (p.status ?? 'active') !== 'inactive')
}

export default async function ProductsGrid({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams
  const products = await getProducts(params)

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🥻</div>
        <h3 className="text-xl font-semibold text-gray-700">No sarees found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  let items = toDisplayItems(products)
  // Colour search: show only the matching-colour variant card(s), not every
  // shade of a product that happened to match on colour.
  items = filterItemsForColorSearch(items, params.search as string)
  // Picking a suggestion pins one exact variant card (id-imageIndex) so only
  // that item shows, even when the product's variants share/lack a colour.
  const pinned = params.item as string | undefined
  if (pinned) items = items.filter((it) => it.key === pinned)
  // New Arrival / Best Seller are per-item flags — show only the flagged photos.
  if (params.is_new_arrival === 'true') items = items.filter((it) => it.isNewArrival)
  if (params.is_best_seller === 'true') items = items.filter((it) => it.isBestSeller)

  // Single-category pages show just that one badge (top-left overlay), matching the
  // homepage dropdown sections. Mixed listings (/products, categories) show all badges.
  const onlyBadge = params.is_best_seller === 'true' ? 'best'
    : params.is_new_arrival === 'true' ? 'new'
    : params.on_sale === 'true' ? 'sale'
    : undefined

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🥻</div>
        <h3 className="text-xl font-semibold text-gray-700">No sarees found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return <InfiniteProductsGrid items={items} onlyBadge={onlyBadge} />
}
