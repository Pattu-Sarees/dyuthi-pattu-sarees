import { Loader2 } from 'lucide-react'

/**
 * Shared route-level loading skeletons. These render instantly via App Router
 * `loading.tsx` the moment a <Link> is clicked — the page shell appears during
 * the server round-trip instead of the browser sitting on a blank/frozen view,
 * which is what makes navigation *feel* fast.
 */

// A branded card grid placeholder — matches the product listing layout.
export function ListingSkeleton() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      {/* Banner placeholder */}
      <div className="h-40 md:h-56 bg-[#F5EFE6] animate-pulse" />

      <div className="container mx-auto px-4 pt-3 md:pt-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar — desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="h-96 bg-black/5 rounded-xl animate-pulse" />
          </aside>

          {/* Product cards */}
          <div className="flex-1 min-w-0">
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
          </div>
        </div>
      </div>
    </div>
  )
}

// Product-detail placeholder — image on the left, info column on the right.
export function DetailSkeleton() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[9/10] bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded w-1/2" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimal branded spinner for lighter routes (cart, account, etc.).
export function CenteredSpinner() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
    </div>
  )
}
