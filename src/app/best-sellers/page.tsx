import FilteredListing from '@/components/products/FilteredListing'

export const metadata = { title: 'Best Sellers | Dyuthi Pattu Sarees' }

export default function BestSellersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const merged = (async () => ({ is_best_seller: 'true', ...(await searchParams) }))()
  return (
    <FilteredListing emoji="🔥" title="Best Sellers" subtitle="Our most loved sarees, handpicked by our customers." searchParams={merged} />
  )
}
