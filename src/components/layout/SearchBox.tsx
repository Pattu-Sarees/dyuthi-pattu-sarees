'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice, toTitleCase } from '@/lib/utils'

// One matching colour-variant item (from /api/search). Clicking opens the
// product on this exact colour via ?image={imageIndex}.
interface Suggestion {
  id: string
  name: string
  color?: string
  price?: number
  category?: string
  image?: string
  imageIndex?: number
}

// Module-level cache of typeahead results, keyed by `scope|term`. Survives
// component remounts (desktop/mobile boxes) for the session, so re-typing or
// re-opening a recent query is instant and hits no network. Capped to keep
// memory bounded.
const suggestionCache = new Map<string, Suggestion[]>()
const SUGGESTION_CACHE_MAX = 60

// Bold the matched query words inside a suggestion name.
function highlight(name: string, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter((w) => w.length >= 2)
  if (!words.length) return name
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig')
  return name.split(re).map((part, i) =>
    words.includes(part.toLowerCase()) ? <mark key={i} className="bg-transparent text-[#AD1457] font-semibold">{part}</mark> : <span key={i}>{part}</span>
  )
}

export default function SearchBox({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()
  const urlSearch = params.get('search') || ''

  // Origin page name — shown in the results hero when a search finds no match
  // (so we never blindly display the typed term). Preserved across refinements.
  const PAGE_NAMES: Record<string, string> = {
    '/best-sellers': 'Best Sellers', '/new-arrivals': 'New Arrivals',
    '/on-sale': 'On Sale', '/products': 'All Collections', '/': 'All Collections',
  }
  const originFrom = pathname === '/products' ? (params.get('from') || 'All Collections') : (PAGE_NAMES[pathname] || 'All Collections')

  // Search within the CURRENT listing page (so the active nav item / hero stay
  // put) when we're on one; otherwise fall back to All Collections (/products).
  const LISTING_PATHS = new Set(['/products', '/new-arrivals', '/best-sellers', '/on-sale'])
  const listingPath = LISTING_PATHS.has(pathname) ? pathname : '/products'
  const searchUrl = (term: string) => `${listingPath}?search=${encodeURIComponent(term)}&from=${encodeURIComponent(originFrom)}`

  // Scope the dropdown suggestions to the current page's own filter, so e.g. on
  // Best Sellers a search only suggests best-seller items.
  const SCOPES: Record<string, string> = { '/best-sellers': 'best', '/new-arrivals': 'new', '/on-sale': 'sale' }
  const scope = SCOPES[pathname] || ''

  const [q, setQ] = useState(urlSearch)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1) // -1 = none; items.length = "See all"
  const boxRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastTypedRef = useRef(0)
  const suppressLiveRef = useRef(false) // skip one live-search run after an explicit pick/clear

  // Keep the box showing the active search term (persists after searching) —
  // but don't clobber what the user is actively typing (live-search updates the URL).
  useEffect(() => {
    if (Date.now() - lastTypedRef.current > 1200) setQ(urlSearch)
  }, [urlSearch])

  // Live search: as the user types (no Enter needed), filter the CURRENT listing
  // page in place — the active nav item and page hero stay put. Clearing removes
  // the search. Skipped on the Contact page. Uses replace while refining an
  // existing search so the back button still returns to the un-searched page.
  useEffect(() => {
    if (pathname === '/contact') return
    const t = setTimeout(() => {
      if (suppressLiveRef.current) { suppressLiveRef.current = false; return }
      const term = q.trim()
      const current = params.get('search') || ''
      if (term.length >= 2) {
        if (term !== current) {
          const url = searchUrl(term)
          if (current) router.replace(url)
          else router.push(url)
        }
      } else if (term.length === 0 && current) {
        router.replace(listingPath)
      }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pathname])

  // Debounced typeahead suggestions (300ms) — hits the dedicated /api/search
  // endpoint, which searches only name/category/code/colour and returns matches
  // ordered by precision (code > colour > name > category).
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setItems([])
      setLoading(false)
      return
    }
    // Serve identical results from cache instantly (no network, no spinner).
    const cacheKey = `${scope}|${term.toLowerCase()}`
    const cached = suggestionCache.get(cacheKey)
    if (cached) {
      setItems(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/search?query=${encodeURIComponent(term)}&limit=6${scope ? `&scope=${scope}` : ''}`)
        .then((r) => r.json())
        .then((d) => {
          const next = ((d.items as Suggestion[]) || []).slice(0, 6)
          if (suggestionCache.size >= SUGGESTION_CACHE_MAX) suggestionCache.delete(suggestionCache.keys().next().value!)
          suggestionCache.set(cacheKey, next)
          setItems(next)
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scope])

  useEffect(() => setActive(-1), [items])

  // Close the dropdown on outside click.
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const term = q.trim()
  const showDropdown = open && term.length >= 2
  const noMatches = showDropdown && !loading && items.length === 0

  // Explicit submit (Enter / search icon / "See all"): show matched items in the
  // body AND swap the hero to the matched item's category. `h=cat` tells the
  // header to show the category; `hc` passes it along when we already know it
  // (from the loaded suggestions) so the hero updates without a flicker.
  const goToResults = () => {
    if (!term) return
    setOpen(false)
    const hc = items[0]?.category ? `&hc=${encodeURIComponent(items[0].category)}` : ''
    router.push(`${searchUrl(term)}&h=cat${hc}`)
    onNavigate?.()
  }

  const pick = (s: Suggestion) => {
    lastTypedRef.current = Date.now()
    suppressLiveRef.current = true
    setOpen(false)
    setItems([])
    // Show the selected item ALONE in the listing on the SAME page — don't jump
    // to the product detail screen (that also caused a bounce back to All
    // Collections). `item=<productId>-<imageIndex>` pins exactly this variant
    // card (colour alone isn't enough when a product's variants share/lack a
    // colour). The user opens details by clicking the card. Hero shows the
    // item's category (h=cat).
    const termToUse = s.name
    setQ(toTitleCase(termToUse))
    const hc = s.category ? `&hc=${encodeURIComponent(s.category)}` : ''
    const itemKey = `${s.id}-${s.imageIndex ?? 0}`
    router.push(`${searchUrl(termToUse)}&h=cat${hc}&item=${encodeURIComponent(itemKey)}`)
    onNavigate?.()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    goToResults()
  }

  // Keyboard navigation across suggestions + the "See all" row.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    const max = items.length // index of "See all"
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, max))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Enter') {
      if (active >= 0 && active < items.length) {
        e.preventDefault()
        pick(items[active])
      } // else let the form submit → goToResults
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const clear = () => {
    lastTypedRef.current = Date.now()
    suppressLiveRef.current = true
    setQ('')
    setItems([])
    setOpen(false)
    inputRef.current?.focus()
    // Restore the full listing if we're viewing search results.
    if ((params.get('search') || '')) router.replace('/products')
  }

  const dropdownWidth = variant === 'mobile' ? 'left-0 right-0' : 'w-full min-w-[18rem]'

  // Stable id across SSR + client render (Math.random() caused a hydration mismatch).
  const listId = useId()

  return (
    <form onSubmit={submit} ref={boxRef} className={`relative ${variant === 'mobile' ? 'flex gap-2 w-full max-w-sm mx-auto' : ''}`}>
      <div className={`relative ${variant === 'desktop' ? 'w-44 lg:w-56' : 'flex-1'}`}>
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-[#AD1457]"
        >
          <Search className="h-4 w-4" />
        </button>
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => { lastTypedRef.current = Date.now(); setQ(e.target.value); setOpen(true) }}
          onFocus={() => term.length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search sarees..."
          aria-expanded={showDropdown}
          aria-controls={listId}
          role="combobox"
          className={`pl-10 pr-8 w-full h-9 ${variant === 'mobile' ? 'text-sm' : ''}`}
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : q ? (
          <button type="button" onClick={clear} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {variant === 'mobile' && (
        <Button type="submit" size="sm" className="h-9 bg-[#AD1457] hover:bg-[#880E4F] text-white">Search</Button>
      )}

      {/* Typeahead dropdown */}
      {showDropdown && (loading || items.length > 0 || noMatches) && (
        <div id={listId} role="listbox" className={`absolute top-full z-[70] mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-96 overflow-y-auto ${dropdownWidth}`}>
          {noMatches ? (
            <p className="px-3 py-3 text-sm text-gray-500">No sarees found</p>
          ) : (
            <>
              {items.map((s, i) => (
                <button
                  type="button"
                  key={`${s.id}-${s.imageIndex ?? 0}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left ${active === i ? 'bg-rose-50' : 'hover:bg-rose-50'}`}
                >
                  <span className="relative h-9 w-9 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {s.image && <Image src={s.image} alt="" fill className="object-cover" sizes="36px" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-gray-800 truncate">
                      {highlight(toTitleCase(s.name), term)}
                      {s.color && <span className="text-gray-400"> · {highlight(toTitleCase(s.color), term)}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {typeof s.price === 'number' && <span className="text-xs font-semibold text-[#C2185B]">{formatPrice(s.price)}</span>}
                      {s.category && <span className="text-[11px] text-gray-400 capitalize">{s.category}</span>}
                    </span>
                  </span>
                </button>
              ))}
              {items.length > 0 && (
                <button
                  type="button"
                  role="option"
                  aria-selected={active === items.length}
                  onMouseEnter={() => setActive(items.length)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={goToResults}
                  className={`w-full text-left px-3 py-2.5 text-xs font-semibold text-[#AD1457] border-t border-gray-50 ${active === items.length ? 'bg-rose-50' : 'hover:bg-rose-50'}`}
                >
                  See all results for “{term}”
                </button>
              )}
            </>
          )}
        </div>
      )}
    </form>
  )
}
