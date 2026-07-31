import { createClient } from '@/lib/supabase/server'
import PaginatedProductsGrid from './PaginatedProductsGrid'
import { fetchAllProducts, productsToItems, computeOnlyBadge } from '@/lib/products-query'

function Empty() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🥻</div>
      <h3 className="text-xl font-semibold text-gray-700">No sarees found</h3>
      <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
    </div>
  )
}

export default async function ProductsGrid({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch matching products (capped), flatten to display cards. The grid then
  // reveals cards in batches on scroll (infinite scroll by item cards).
  const products = await fetchAllProducts(supabase as never, params)
  if (products.length === 0) return <Empty />

  const items = productsToItems(products, params)
  if (items.length === 0) return <Empty />

  return <PaginatedProductsGrid allItems={items} onlyBadge={computeOnlyBadge(params)} />
}
