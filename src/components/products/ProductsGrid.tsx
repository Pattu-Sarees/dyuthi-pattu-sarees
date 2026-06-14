import { createClient } from '@/lib/supabase/server'
import ProductCard from './ProductCard'
import { Product } from '@/types'

async function getProducts(searchParams: Record<string, string | string[]>) {
  const supabase = await createClient()
  let query = supabase.from('products').select('*')

  const search = searchParams.search as string
  if (search) query = query.ilike('name', `%${search}%`)

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

  const occasion = searchParams.occasion
  if (occasion) {
    const occ = Array.isArray(occasion) ? occasion : [occasion]
    query = query.overlaps('occasion', occ)
  }

  const region = searchParams.region
  if (region) {
    const regions = Array.isArray(region) ? region : [region]
    query = query.in('region', regions)
  }

  const color = searchParams.color
  if (color) {
    const colors = Array.isArray(color) ? color : [color]
    query = query.overlaps('color', colors)
  }

  const priceMin = searchParams.price_min as string
  const priceMax = searchParams.price_max as string
  if (priceMin) query = query.gte('price', Number(priceMin))
  if (priceMax) query = query.lte('price', Number(priceMax))

  if (searchParams.in_stock === 'true') query = query.eq('in_stock', true)
  if (searchParams.is_featured === 'true') query = query.eq('is_featured', true)
  if (searchParams.is_new_arrival === 'true') query = query.eq('is_new_arrival', true)

  const sort = searchParams.sort as string
  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'rating': query = query.order('rating', { ascending: false }); break
    case 'popular': query = query.order('review_count', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(40)
  if (error) return []
  return data as Product[]
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

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{products.length} sarees found</p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
