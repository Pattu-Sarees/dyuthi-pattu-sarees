import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { searchTextPattern, buildFallbackSearchOr, normalizeSearch } from '@/lib/product-search'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)

  // Build the full query for a given search filter. Kept as a closure so we can
  // re-run it with the fallback builder if the preferred one fails.
  const runQuery = (mode: 'search_text' | 'fallback') => {
    let query = supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS)

    const searchParam = searchParams.get('search')
    if (mode === 'search_text') {
      const pattern = searchTextPattern(searchParam)
      if (pattern) query = query.ilike('search_text', pattern)
    } else {
      const or = buildFallbackSearchOr(searchParam)
      if (or) query = query.or(or)
    }

    // Category filter
    const categories = searchParams.getAll('category')
    if (categories.length > 0) query = query.in('category', categories)

    // Fabric filter
    const fabrics = searchParams.getAll('fabric')
    if (fabrics.length > 0) query = query.in('fabric', fabrics)

    // Occasion filter
    const occasions = searchParams.getAll('occasion')
    if (occasions.length > 0) query = query.overlaps('occasion', occasions)

    // Region filter
    const regions = searchParams.getAll('region')
    if (regions.length > 0) query = query.in('region', regions)

    // Color filter
    const colors = searchParams.getAll('color')
    if (colors.length > 0) query = query.overlaps('color', colors)

    // Price range
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    if (priceMin) query = query.gte('price', Number(priceMin))
    if (priceMax) query = query.lte('price', Number(priceMax))

    // In stock
    if (searchParams.get('in_stock') === 'true') query = query.eq('in_stock', true)

    // Featured / new arrivals / best sellers
    if (searchParams.get('is_featured') === 'true') query = query.eq('is_featured', true)
    if (searchParams.get('is_new_arrival') === 'true') query = query.eq('is_new_arrival', true)
    if (searchParams.get('is_best_seller') === 'true') query = query.eq('is_best_seller', true)

    // Sort
    switch (searchParams.get('sort')) {
      case 'price_asc': query = query.order('price', { ascending: true }); break
      case 'price_desc': query = query.order('price', { ascending: false }); break
      case 'rating': query = query.order('rating', { ascending: false }); break
      case 'popular': query = query.order('review_count', { ascending: false }); break
      default: query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * limit
    return query.range(from, from + limit - 1)
  }

  // Prefer the generated search_text column (full-phrase match incl. colour).
  // If it's absent (migration not yet run) the query errors, so retry with the
  // migration-free per-column fallback.
  const hasSearch = normalizeSearch(searchParams.get('search')) !== ''
  let { data, error, count } = await runQuery('search_text')

  if (error && hasSearch) {
    ;({ data, error, count } = await runQuery('fallback'))
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data, count, page, limit })
}
