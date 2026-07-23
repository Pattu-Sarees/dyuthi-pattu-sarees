import FilteredListing from '@/components/products/FilteredListing'

export const metadata = { title: 'New Arrivals | Dyuthi Pattu Sarees' }

export default function NewArrivalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const merged = (async () => ({ ...(await searchParams), is_new_arrival: 'true' }))()
  return (
    <FilteredListing emoji="✨" title="New Arrivals" subtitle="Fresh handloom weaves, just off the loom" searchParams={merged} />
  )
}
