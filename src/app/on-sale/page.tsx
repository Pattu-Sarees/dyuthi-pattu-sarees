import FilteredListing from '@/components/products/FilteredListing'

export const metadata = { title: 'On Sale | Dyuthi Pattu Sarees' }

export default function OnSalePage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const merged = (async () => ({ ...(await searchParams), on_sale: 'true' }))()
  return (
    <FilteredListing emoji="🎉" title="On Sale" subtitle="Exclusive savings on premium handloom sarees." searchParams={merged} />
  )
}
