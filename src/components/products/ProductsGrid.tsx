import PaginatedProductsGrid from './PaginatedProductsGrid'
import { productsToItems, computeOnlyBadge } from '@/lib/products-query'
import { getListingProducts } from '@/lib/storefront-data'

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

  // Cached (anon) read — repeat navigations to a collection skip the DB.
  const products = await getListingProducts(params)
  if (products.length === 0) return <Empty />

  const items = productsToItems(products, params)
  if (items.length === 0) return <Empty />

  return <PaginatedProductsGrid allItems={items} onlyBadge={computeOnlyBadge(params)} />
}
