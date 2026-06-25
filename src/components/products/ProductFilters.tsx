'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'

const FILTERS = {
  category: ['mangalgiri', 'kuppadam', 'gadwal', 'kota', 'kanchipattu', 'soft silks', 'jamdhani', 'butter silk', 'green mango'],
  fabric: ['pure silk', 'blended silk', 'pure cotton', 'handloom cotton', 'linen', 'georgette'],
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function ProductFilters({ theme = 'light', onChange }: { theme?: 'light' | 'dark'; onChange?: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dark = theme === 'dark'

  const head = dark ? 'text-[#4E1E24]' : 'text-gray-900'
  const label = dark ? 'text-[#4E1E24]' : 'text-gray-700'
  const input = dark
    ? 'w-full text-sm bg-white border border-[#4E1E24]/25 text-[#4E1E24] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2185B] placeholder-[#4E1E24]/50'
    : 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500'
  const chipActive = 'bg-[#C2185B] text-white border-[#C2185B]'
  const chipInactive = dark
    ? 'bg-white text-[#4E1E24] border-[#4E1E24]/30 hover:border-[#C2185B] hover:text-[#C2185B]'
    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
  const clearCls = dark ? 'text-[#C2185B] hover:text-[#a01049]' : 'text-rose-600 hover:text-rose-700'

  const after = () => { onChange?.() }

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
      router.push(`/products?${params.toString()}`)
      onChange?.()
    },
    [router, searchParams, onChange]
  )

  const toggleArrayParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const existing = params.getAll(key)
      if (existing.includes(value)) {
        params.delete(key)
        existing.filter((v) => v !== value).forEach((v) => params.append(key, v))
      } else {
        params.append(key, value)
      }
      router.push(`/products?${params.toString()}`)
      onChange?.()
    },
    [router, searchParams, onChange]
  )

  const clearAll = () => { router.push('/products'); after() }
  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${head}`}>Filters</h3>
        {hasFilters && (
          <button onClick={clearAll} className={`text-xs flex items-center gap-1 ${clearCls}`}>
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Availability */}
      <div>
        <h4 className={`text-sm font-medium mb-2 ${label}`}>Availability</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={searchParams.get('availability') === 'in_stock'} onChange={(e) => updateParam('availability', e.target.checked ? 'in_stock' : null)} className="accent-[#C2185B]" />
            <span className={`text-sm ${label}`}>In Stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={searchParams.get('availability') === 'out_of_stock'} onChange={(e) => updateParam('availability', e.target.checked ? 'out_of_stock' : null)} className="accent-[#C2185B]" />
            <span className={`text-sm ${label}`}>Out of Stock</span>
          </label>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className={`text-sm font-medium mb-2 ${label}`}>Sort By</h4>
        <select value={searchParams.get('sort') || ''} onChange={(e) => updateParam('sort', e.target.value || null)} className={`${input} text-gray-900`}>
          <option value="">Default</option>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className={`text-sm font-medium mb-2 ${label}`}>Price Range</h4>
        <div className="flex gap-2">
          <input type="number" placeholder="Min ₹" defaultValue={searchParams.get('price_min') || ''} onBlur={(e) => updateParam('price_min', e.target.value || null)} className={input} />
          <input type="number" placeholder="Max ₹" defaultValue={searchParams.get('price_max') || ''} onBlur={(e) => updateParam('price_max', e.target.value || null)} className={input} />
        </div>
      </div>

      {/* Filter groups */}
      {Object.entries(FILTERS).map(([key, values]) => (
        <div key={key}>
          <h4 className={`text-sm font-medium mb-2 capitalize ${label}`}>{key}</h4>
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => {
              const active = searchParams.getAll(key).includes(v)
              return (
                <button key={v} onClick={() => toggleArrayParam(key, v)} className={`px-2.5 py-1 rounded-full text-xs border transition-colors capitalize ${active ? chipActive : chipInactive}`}>
                  {v}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
