'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, Star, Sparkles, Flame } from 'lucide-react'
import ProductCard from './ProductCard'
import { DisplayItem } from './displayItems'

/** Item CARDS revealed per scroll batch. */
const BATCH = 24
const STORAGE_KEY = 'dyuthi_grid_view'
type MobileCols = 2 | 3
type DesktopCols = 1 | 2 | 3 | 4 | 5

const MOBILE_COL_CLASS: Record<MobileCols, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3' }
const DESKTOP_COL_CLASS: Record<DesktopCols, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5',
}
// Cap grid width per column count (centered) for sensible card sizes.
const DESKTOP_MAXW: Record<DesktopCols, string> = {
  1: '',
  2: 'lg:max-w-[696px] lg:mx-auto',
  3: 'lg:max-w-[872px] lg:mx-auto',
  4: 'lg:max-w-[988px] lg:mx-auto',
  5: 'lg:max-w-[1089px] lg:mx-auto',
}

function ColumnIcon({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (<span key={i} className="w-[2.5px] h-4 rounded-[1px] bg-current" />))}
    </span>
  )
}
function ToggleButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={active} onClick={onClick}
      className={`flex items-center justify-center h-9 w-9 rounded-md transition-colors duration-200 ${active ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
      {children}
    </button>
  )
}

export default function PaginatedProductsGrid({
  allItems, onlyBadge,
}: {
  allItems: DisplayItem[]
  onlyBadge?: 'best' | 'new' | 'sale'
}) {
  const [visible, setVisible] = useState(Math.min(BATCH, allItems.length))
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset the reveal when the item set changes (filters / search / sort).
  useEffect(() => { setVisible(Math.min(BATCH, allItems.length)) }, [allItems])

  const hasMore = visible < allItems.length

  // Infinite scroll: reveal the next BATCH of cards as the sentinel nears view.
  // A short delay keeps the "Loading…" spinner perceptible (async feel).
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        setLoading(true)
        setTimeout(() => {
          setVisible((v) => Math.min(v + BATCH, allItems.length))
          setLoading(false)
        }, 800)
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, allItems.length])

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
  useEffect(() => {
    if (!changing) return
    const t = setTimeout(() => setChanging(false), 250)
    return () => clearTimeout(t)
  }, [changing])

  const isListView = desktopCols === 1
  const shown = allItems.slice(0, visible)

  return (
    <div>
      <div className="flex items-center justify-end mb-2 md:mb-4">
        <div className="flex lg:hidden items-center gap-1.5">
          {([2, 3] as MobileCols[]).map((n) => (
            <ToggleButton key={n} active={mobileCols === n} label={`${n} per row`} onClick={() => setView({ mobile: n })}><ColumnIcon count={n} /></ToggleButton>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-1.5">
          <ToggleButton active={desktopCols === 1} label="List view" onClick={() => setView({ desktop: 1 })}><Menu className="h-4 w-4" /></ToggleButton>
          {([2, 3, 4, 5] as DesktopCols[]).map((n) => (
            <ToggleButton key={n} active={desktopCols === n} label={`${n} per row`} onClick={() => setView({ desktop: n })}><ColumnIcon count={n} /></ToggleButton>
          ))}
        </div>
      </div>

      {/* Badge legend — mobile only. Cards show icon-only badges, so this explains
          the symbols. On single-category pages (New/Best/Sale) only the relevant
          one is shown. */}
      <div className="flex lg:hidden flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-gray-600">
        {(!onlyBadge || onlyBadge === 'best') && (
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-[#B8860B] fill-current" /> Best Seller</span>
        )}
        {(!onlyBadge || onlyBadge === 'new') && (
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-[#2E8B57] fill-current" /> New</span>
        )}
        {(!onlyBadge || onlyBadge === 'sale') && (
          <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-[#C73B75] fill-current" /> On Sale</span>
        )}
      </div>

      <div className={`grid ${MOBILE_COL_CLASS[mobileCols]} ${DESKTOP_COL_CLASS[desktopCols]} gap-4 transition-opacity duration-300 ease-in-out ${changing ? 'opacity-50' : 'opacity-100'} ${DESKTOP_MAXW[desktopCols]}`}>
        {shown.map((item) => (
          <div key={item.key} className="min-w-0 animate-card-in">
            <ProductCard product={item.product} image={item.image} imageIndex={item.imageIndex} isNewArrival={item.isNewArrival} isBestSeller={item.isBestSeller} onlyBadge={onlyBadge} variant={isListView ? 'list' : 'grid'} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <span className="flex items-center justify-center h-12 w-12 rounded-full bg-[#AD1457] shadow-lg">
            <span className="h-6 w-6 rounded-full border-[3px] border-white/40 border-t-white animate-spin" />
          </span>
        </div>
      )}
    </div>
  )
}
