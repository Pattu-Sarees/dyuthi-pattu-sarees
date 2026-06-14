import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  let query = supabase.from('products').select('*')

  // Search
  const search = searchParams.get('search')
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // Category filter
  const categories = searchParams.getAll('category')
  if (categories.length > 0) {
    query = query.in('category', categories)
  }

  // Fabric filter
  const fabrics = searchParams.getAll('fabric')
  if (fabrics.length > 0) {
    query = query.in('fabric', fabrics)
  }

  // Occasion filter
  const occasions = searchParams.getAll('occasion')
  if (occasions.length > 0) {
    query = query.overlaps('occasion', occasions)
  }

  // Region filter
  const regions = searchParams.getAll('region')
  if (regions.length > 0) {
    query = query.in('region', regions)
  }

  // Color filter
  const colors = searchParams.getAll('color')
  if (colors.length > 0) {
    query = query.overlaps('color', colors)
  }

  // Price range
  const priceMin = searchParams.get('price_min')
  const priceMax = searchParams.get('price_max')
  if (priceMin) query = query.gte('price', Number(priceMin))
  if (priceMax) query = query.lte('price', Number(priceMax))

  // In stock
  if (searchParams.get('in_stock') === 'true') {
    query = query.eq('in_stock', true)
  }

  // Featured / new arrivals
  if (searchParams.get('is_featured') === 'true') {
    query = query.eq('is_featured', true)
  }
  if (searchParams.get('is_new_arrival') === 'true') {
    query = query.eq('is_new_arrival', true)
  }

  // Sort
  const sort = searchParams.get('sort')
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'rating':
      query = query.order('rating', { ascending: false })
      break
    case 'popular':
      query = query.order('review_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data, count, page, limit })
}
