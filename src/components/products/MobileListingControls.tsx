'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react'
import ProductFilters from './ProductFilters'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Alphabetically, A-Z' },
  { value: 'name_desc', label: 'Alphabetically, Z-A' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'date_asc', label: 'Date, old to new' },
  { value: 'date_desc', label: 'Date, new to old' },
]

export default function MobileListingControls() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || ''

  const applySort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`${pathname}?${params.toString()}`)
    setSortOpen(false)
  }

  return (
    <div className="lg:hidden">
      {/* Filter & Sort — fixed bottom navigation bar. Kept smaller and pushed
          toward the right so the WhatsApp floater (bottom-left) never overlaps it. */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-end pr-4 pl-24">
        <div className="grid grid-cols-2 w-full max-w-[13rem] bg-[#B8860B] text-[#FFF8E7] rounded-full shadow-lg overflow-hidden">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-r border-[#FFF8E7]/25 active:bg-[#9c7209]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          </button>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold active:bg-[#9c7209]"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort
          </button>
        </div>
      </div>

      {/* Filter drawer — slides in from the left */}
      {filterOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Filters">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-[#F5EFE6] shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#F5EFE6] z-10 border-b border-[#e7ddcd]">
              <span className="font-semibold text-[#4E1E24]">Filter</span>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters" className="p-1 rounded-lg hover:bg-black/5 text-[#4E1E24]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <ProductFilters theme="dark" hideSort onChange={() => setFilterOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Sort sheet — drops from the top */}
      {sortOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Sort">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSortOpen(false)} />
          <div className="absolute inset-x-0 top-0 bg-[#F5EFE6] rounded-b-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7ddcd]">
              <span className="font-semibold text-[#4E1E24]">Sort</span>
              <button onClick={() => setSortOpen(false)} aria-label="Close sort" className="p-1 rounded-lg hover:bg-black/5">
                <X className="h-5 w-5 text-[#4E1E24]" />
              </button>
            </div>
            {SORT_OPTIONS.map((o) => {
              const active = currentSort === o.value
              return (
                <button
                  key={o.value}
                  onClick={() => applySort(o.value)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-[#e7ddcd] text-sm text-[#4E1E24] hover:bg-black/5"
                >
                  {o.label}
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full border ${active ? 'border-[#AD1457] bg-[#AD1457] text-white' : 'border-[#4E1E24]/30'}`}>
                    {active && <Check className="h-3 w-3" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
