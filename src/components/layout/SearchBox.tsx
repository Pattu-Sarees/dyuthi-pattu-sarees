'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice, toTitleCase } from '@/lib/utils'

interface Suggestion {
  id: string
  name: string
  images?: string[]
  price?: number
  category?: string
}

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

  // Live search: as the user types (no Enter needed), show matched products by
  // navigating to the filtered listing. Clearing shows all products. Skipped on
  // the Contact page. Uses replace while refining an existing search so the back
  // button still returns to the page the user searched from.
  useEffect(() => {
    if (pathname === '/contact') return
    const t = setTimeout(() => {
      if (suppressLiveRef.current) { suppressLiveRef.current = false; return }
      const term = q.trim()
      const current = params.get('search') || ''
      if (term.length >= 2) {
        if (term !== current) {
          const url = `/products?search=${encodeURIComponent(term)}`
          if (pathname === '/products' && current) router.replace(url)
          else router.push(url)
        }
      } else if (term.length === 0 && current) {
        router.replace('/products')
      }
    }, 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pathname])

  // Debounced typeahead suggestions.
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(term)}&limit=6`)
        .then((r) => r.json())
        .then((d) => setItems(((d.products as Suggestion[]) || []).slice(0, 6)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 220)
    return () => clearTimeout(t)
  }, [q])

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

  const goToResults = () => {
    if (!term) return
    setOpen(false)
    router.push(`/products?search=${encodeURIComponent(term)}`)
    onNavigate?.()
  }

  const pick = (s: Suggestion) => {
    lastTypedRef.current = Date.now()
    suppressLiveRef.current = true
    setOpen(false)
    setItems([])
    // Selecting a suggestion opens that product's CATEGORY listing (name + its
    // items), not the detail page. Falls back to a name search if no category.
    // The box keeps showing the term so it doesn't vanish after selecting.
    if (s.category) {
      setQ(toTitleCase(s.category))
      router.push(`/products?category=${encodeURIComponent(s.category)}`)
    } else {
      setQ(toTitleCase(s.name))
      router.push(`/products?search=${encodeURIComponent(s.name)}`)
    }
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

  const listId = useMemo(() => `sb-${Math.random().toString(36).slice(2, 8)}`, [])

  return (
    <form onSubmit={submit} ref={boxRef} className={`relative ${variant === 'mobile' ? 'flex gap-2 w-full max-w-sm mx-auto' : ''}`}>
      <div className={`relative ${variant === 'desktop' ? 'w-44 lg:w-56' : 'flex-1'}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <div id={listId} role="listbox" className={`absolute z-[70] mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-96 overflow-y-auto ${dropdownWidth}`}>
          {noMatches ? (
            <p className="px-3 py-3 text-sm text-gray-500">No matches found</p>
          ) : (
            <>
              {items.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left ${active === i ? 'bg-rose-50' : 'hover:bg-rose-50'}`}
                >
                  <span className="relative h-9 w-9 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {s.images?.[0] && <Image src={s.images[0]} alt="" fill className="object-cover" sizes="36px" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-gray-800 truncate">{highlight(toTitleCase(s.name), term)}</span>
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
