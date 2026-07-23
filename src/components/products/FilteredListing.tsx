import { Suspense } from 'react'
import PageBanner from '@/components/layout/PageBanner'
import ProductFilters from './ProductFilters'
import ProductsGrid from './ProductsGrid'
import MobileListingControls from './MobileListingControls'
import CollectionsHeader from './CollectionsHeader'

export default function FilteredListing({
  emoji,
  title,
  subtitle,
  searchParams,
  categoryHero = false,
}: {
  emoji?: string
  title: string
  subtitle?: string
  searchParams: Promise<Record<string, string | string[]>>
  categoryHero?: boolean
}) {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      {categoryHero ? (
        <Suspense fallback={<PageBanner emoji={emoji} title={title} subtitle={subtitle} />}>
          <CollectionsHeader emoji={emoji} title={title} subtitle={subtitle} />
        </Suspense>
      ) : (
        <PageBanner emoji={emoji} title={title} subtitle={subtitle} />
      )}

      <div className="container mx-auto px-4 pt-3 md:pt-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar — desktop only */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-[#F5EFE6] border border-[#e7ddcd] shadow-sm p-5 sticky top-24">
              <Suspense fallback={<div className="animate-pulse h-96 bg-black/5 rounded-xl" />}>
                <ProductFilters theme="dark" />
              </Suspense>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter / Sort controls */}
            <Suspense fallback={null}>
              <MobileListingControls />
            </Suspense>

            <Suspense fallback={<ProductsGridSkeleton />}>
              <ProductsGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
          <div className="aspect-[9/10] bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
