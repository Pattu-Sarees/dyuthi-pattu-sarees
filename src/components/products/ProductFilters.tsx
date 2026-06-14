'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FILTERS = {
  category: ['silk', 'cotton', 'banarasi', 'kanjivaram', 'chanderi', 'patola', 'linen', 'georgette'],
  fabric: ['pure silk', 'blended silk', 'pure cotton', 'handloom cotton', 'linen', 'georgette'],
  occasion: ['wedding', 'festival', 'casual', 'party', 'office', 'bridal'],
  region: ['varanasi', 'kanchipuram', 'odisha', 'gujarat', 'assam', 'bengal', 'madhya pradesh'],
  color: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'white', 'black', 'gold'],
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
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
    },
    [router, searchParams]
  )

  const clearAll = () => router.push('/products')

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
        <select
          value={searchParams.get('sort') || ''}
          onChange={(e) => updateParam('sort', e.target.value || null)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">Default</option>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            defaultValue={searchParams.get('price_min') || ''}
            onBlur={(e) => updateParam('price_min', e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <input
            type="number"
            placeholder="Max ₹"
            defaultValue={searchParams.get('price_max') || ''}
            onBlur={(e) => updateParam('price_max', e.target.value || null)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Filter groups */}
      {Object.entries(FILTERS).map(([key, values]) => (
        <div key={key}>
          <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{key}</h4>
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => {
              const active = searchParams.getAll(key).includes(v)
              return (
                <button
                  key={v}
                  onClick={() => toggleArrayParam(key, v)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors capitalize ${
                    active
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
                  }`}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* In stock only */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="in_stock"
          checked={searchParams.get('in_stock') === 'true'}
          onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
          className="accent-rose-600"
        />
        <label htmlFor="in_stock" className="text-sm text-gray-700 cursor-pointer">In Stock Only</label>
      </div>
    </div>
  )
}
