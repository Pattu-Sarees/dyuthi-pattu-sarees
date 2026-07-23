'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import CollectionsGrid from './CollectionsGrid'
import { DisplayItem } from './displayItems'

type TabKey = 'new' | 'best' | 'sale'

const TABS: { key: TabKey; label: string; href: string; badge: 'best' | 'new' | 'sale' }[] = [
  { key: 'new', label: 'New Arrivals', href: '/new-arrivals', badge: 'new' },
  { key: 'best', label: 'Best Sellers', href: '/best-sellers', badge: 'best' },
  { key: 'sale', label: 'On Sale', href: '/on-sale', badge: 'sale' },
]

export default function FeaturedCollections({
  newArrivals,
  bestSellers,
  onSale,
}: {
  newArrivals: DisplayItem[]
  bestSellers: DisplayItem[]
  onSale: DisplayItem[]
}) {
  const [selected, setSelected] = useState<TabKey>('new')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const active = TABS.find((t) => t.key === selected)!
  const items = selected === 'new' ? newArrivals : selected === 'best' ? bestSellers : onSale

  return (
    <div>
      {/* Dropdown heading */}
      <div className="flex justify-center mb-8">
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-2 text-3xl md:text-4xl font-bold text-[#4E1E24]"
            style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}
          >
            {active.label}
            <ChevronDown className={`h-7 w-7 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <ul
              role="listbox"
              className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 z-20 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 py-1"
            >
              {TABS.map((t) => (
                <li key={t.key} role="option" aria-selected={t.key === selected}>
                  <button
                    type="button"
                    onClick={() => { setSelected(t.key); setOpen(false) }}
                    className={`w-full text-left px-5 py-2.5 text-lg hover:bg-gray-50 ${
                      t.key === selected ? 'text-[#C2185B] font-semibold' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <CollectionsGrid items={items} viewAllHref={active.href} onlyBadge={active.badge} />
      ) : (
        <p className="text-center text-gray-500 py-10">No products to show yet.</p>
      )}
    </div>
  )
}
