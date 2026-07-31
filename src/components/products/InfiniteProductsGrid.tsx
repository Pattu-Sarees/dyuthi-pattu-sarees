'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import ProductCard from './ProductCard'
import { DisplayItem } from './displayItems'

const BATCH = 20
const STORAGE_KEY = 'dyuthi_grid_view'

type MobileCols = 2 | 3
type DesktopCols = 1 | 2 | 3 | 4 | 5

// Literal class strings (not template-built) so Tailwind's compiler picks them up.
const MOBILE_COL_CLASS: Record<MobileCols, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}
const DESKTOP_COL_CLASS: Record<DesktopCols, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

// Small "N vertical bars" glyph used for the 2/3/4/5-per-row toggle buttons.
function ColumnIcon({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="w-[2.5px] h-4 rounded-[1px] bg-current" />
      ))}
    </span>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center justify-center h-9 w-9 rounded-md transition-colors duration-200 ${
        active ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

export default function InfiniteProductsGrid({ items, onlyBadge }: { items: DisplayItem[]; onlyBadge?: 'best' | 'new' | 'sale' }) {
  const [visible, setVisible] = useState(Math.min(BATCH, items.length))
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Grid view — defaults match the required desktop/mobile defaults; restored
  // from localStorage after mount (client-only) so the layout persists across refreshes.
  const [mobileCols, setMobileCols] = useState<MobileCols>(2)
  const [desktopCols, setDesktopCols] = useState<DesktopCols>(4)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved.mobile === 2 || saved.mobile === 3) setMobileCols(saved.mobile)
      if ([1, 2, 3, 4, 5].includes(saved.desktop)) setDesktopCols(saved.desktop)
    } catch {}
  }, [])

  const setView = (next: { mobile?: MobileCols; desktop?: DesktopCols }) => {
    setChanging(true)
    if (next.mobile) setMobileCols(next.mobile)
    if (next.desktop) setDesktopCols(next.desktop)
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }))
    } catch {}
  }

  // Brief fade while the layout changes so the switch feels smooth.
  useEffect(() => {
    if (!changing) return
    const t = setTimeout(() => setChanging(false), 250)
    return () => clearTimeout(t)
  }, [changing])

  const hasMore = visible < items.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + BATCH, items.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, items.length])

  const isListView = desktopCols === 1

  return (
    <div>
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <p className="text-sm text-gray-500">{items.length} sarees found</p>

        {/* Mobile view toggle — 2 / 3 per row */}
        <div className="flex lg:hidden items-center gap-1.5">
          {([2, 3] as MobileCols[]).map((n) => (
            <ToggleButton key={n} active={mobileCols === n} label={`${n} per row`} onClick={() => setView({ mobile: n })}>
              <ColumnIcon count={n} />
            </ToggleButton>
          ))}
        </div>

        {/* Desktop view toggle — list / 2 / 3 / 4 / 5 per row */}
        <div className="hidden lg:flex items-center gap-1.5">
          <ToggleButton active={desktopCols === 1} label="List view" onClick={() => setView({ desktop: 1 })}>
            <Menu className="h-4 w-4" />
          </ToggleButton>
          {([2, 3, 4, 5] as DesktopCols[]).map((n) => (
            <ToggleButton key={n} active={desktopCols === n} label={`${n} per row`} onClick={() => setView({ desktop: n })}>
              <ColumnIcon count={n} />
            </ToggleButton>
          ))}
        </div>
      </div>

      <div
        className={`grid ${MOBILE_COL_CLASS[mobileCols]} ${DESKTOP_COL_CLASS[desktopCols]} gap-4 transition-opacity duration-300 ease-in-out ${
          changing ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {items.slice(0, visible).map((item) => (
          <div key={item.key} className={`min-w-0 animate-card-in ${desktopCols === 2 ? 'lg:max-w-sm lg:mx-auto lg:w-full' : ''}`}>
            <ProductCard
              product={item.product}
              image={item.image}
              imageIndex={item.imageIndex}
              isNewArrival={item.isNewArrival}
              isBestSeller={item.isBestSeller}
              onlyBadge={onlyBadge}
              variant={isListView ? 'list' : 'grid'}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
        </div>
      )}
    </div>
  )
}
