import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { searchTextPattern, buildFallbackSearchOr, normalizeSearch } from '@/lib/product-search'
import { toDisplayItems, filterItemsForColorSearch } from '@/components/products/displayItems'

// Optimized header-search endpoint. Searches ONLY four fields — product name,
// category, product code, colour — case-insensitively, matching the full phrase.
// Products are ordered by match precision: code > colour > name > category, then
// expanded into individual VARIANT items so a colour search suggests the exact
// matching shade (and clicking it opens the product on that colour), instead of
// the parent product where the colour selection would be lost.
//
// GET  /api/search?query=pink   (also accepts ?q=)
// POST /api/search  { "query": "pink" }
// Both return { items: [...] } — one entry per matching colour variant.

// Columns needed to expand products into variant suggestions.
const SEARCH_COLUMNS =
  'id,name,code,category,color,color_variants,price,original_price,images,slug,in_stock,status,is_new_arrival,is_best_seller'

// Priority rank for a product given the normalized query: lower = higher priority.
// code (0) > colour (1) > name (2) > category (3) > other (4).
function rank(p: Product, n: string): number {
  if (p.code && p.code.toLowerCase().includes(n)) return 0
  if ((p.color || []).some((c) => c.toLowerCase().includes(n))) return 1
  if (p.name && p.name.toLowerCase().includes(n)) return 2
  if (p.category && p.category.toLowerCase().includes(n)) return 3
  return 4
}

export interface VariantSuggestion {
  id: string          // product id
  name: string
  code?: string
  category?: string
  color?: string      // this variant's shade
  price?: number
  original_price?: number | null
  image: string
  imageIndex: number  // index into the product's variants — opens /products/{id}?image={imageIndex}
  slug?: string | null
}

// Page scope — mirrors the listing page's own filter so the dropdown suggests
// only items that page would show (e.g. best-seller Mangalgiri on /best-sellers).
type Scope = 'best' | 'new' | 'sale' | null

async function search(query: string | null, limit: number, scope: Scope) {
  const n = normalizeSearch(query)
  if (!n) return { items: [] as VariantSuggestion[] }

  const supabase = await createClient()

  const run = (mode: 'search_text' | 'fallback') => {
    let q = supabase.from('products').select(SEARCH_COLUMNS)
    if (mode === 'search_text') {
      const pattern = searchTextPattern(query)
      if (pattern) q = q.ilike('search_text', pattern)
    } else {
      const or = buildFallbackSearchOr(query)
      if (or) q = q.or(or)
    }
    // Same product-level scoping the listing pages apply.
    if (scope === 'best') q = q.eq('is_best_seller', true)
    else if (scope === 'new') q = q.eq('is_new_arrival', true)
    else if (scope === 'sale') q = q.not('original_price', 'is', null)
    // Fetch a few products; one product can expand into several variant items.
    return q.limit(Math.max(limit, 12))
  }

  // Prefer search_text; fall back if the migration hasn't added the column yet.
  let { data, error } = await run('search_text')
  if (error) ({ data, error } = await run('fallback'))
  if (error) return { items: [] as VariantSuggestion[], error: error.message }

  const products = ((data as (Product & { status?: string })[]) || [])
    .filter((p) => (p.status ?? 'active') !== 'inactive')
    .sort((a, b) => rank(a, n) - rank(b, n))

  // Expand to variant cards, then keep only the variant(s) whose colour matches
  // a colour query (name/code/category matches keep all the product's variants).
  let cards = filterItemsForColorSearch(toDisplayItems(products), query)
  // Best-seller / New-arrival are per-VARIANT flags — keep only flagged cards,
  // matching what the listing grid renders on those pages.
  if (scope === 'best') cards = cards.filter((it) => it.isBestSeller)
  else if (scope === 'new') cards = cards.filter((it) => it.isNewArrival)

  const items = cards
    .slice(0, limit)
    .map<VariantSuggestion>((it) => ({
      id: it.product.id,
      name: it.product.name,
      code: it.product.code,
      category: it.product.category,
      color: it.color,
      price: it.product.price,
      original_price: it.product.original_price,
      image: it.image,
      imageIndex: it.imageIndex,
      slug: it.product.slug,
    }))

  return { items }
}

function parseScope(v: string | null | undefined): Scope {
  return v === 'best' || v === 'new' || v === 'sale' ? v : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('query') ?? searchParams.get('q')
  const limit = Number(searchParams.get('limit') || 8)
  const result = await search(query, limit, parseScope(searchParams.get('scope')))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ items: result.items })
}

export async function POST(request: NextRequest) {
  let query: string | null = null
  let limit = 8
  let scope: Scope = null
  try {
    const body = await request.json()
    query = typeof body?.query === 'string' ? body.query : null
    if (typeof body?.limit === 'number') limit = body.limit
    scope = parseScope(body?.scope)
  } catch {
    // ignore malformed body — treated as empty query
  }
  const result = await search(query, limit, scope)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ items: result.items })
}
