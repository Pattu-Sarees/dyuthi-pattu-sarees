import FilteredListing from '@/components/products/FilteredListing'

export const metadata = { title: 'All Sarees | Dyuthi Pattu Sarees' }

export default function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  return (
    <FilteredListing emoji="❤️" title="All Collections" subtitle="Authentic handloom sarees from master weavers" searchParams={searchParams} categoryHero />
  )
}
