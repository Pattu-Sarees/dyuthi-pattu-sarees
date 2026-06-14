import { Suspense } from 'react'
import ProductFilters from '@/components/products/ProductFilters'
import ProductsGrid from '@/components/products/ProductsGrid'
import { SlidersHorizontal } from 'lucide-react'

export const metadata = { title: 'All Sarees | Vibha Handloom' }

export default function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handloom Sarees</h1>
        <p className="text-gray-500 text-sm mt-1">Authentic handloom sarees from master weavers</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}>
              <ProductFilters />
            </Suspense>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<ProductsGridSkeleton />}>
            <ProductsGrid searchParams={searchParams} />
          </Suspense>
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
          <div className="aspect-[3/4] bg-gray-100" />
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
