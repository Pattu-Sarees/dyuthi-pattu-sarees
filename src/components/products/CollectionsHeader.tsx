'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import LotusAccent from '@/components/ui/LotusAccent'

const titleCase = (s: string) =>
  s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// Full hero (emoji + title + subtitle) for each page a search can originate from,
// keyed by the origin name carried in ?from=. When a search runs, the results page
// keeps showing the origin page's own hero instead of a stripped-down heading.
const PAGE_HEROES: Record<string, { emoji: string; title: string; subtitle: string }> = {
  'Best Sellers': { emoji: '🔥', title: 'Best Sellers', subtitle: 'Our most loved sarees, handpicked by our customers.' },
  'New Arrivals': { emoji: '✨', title: 'New Arrivals', subtitle: 'Fresh handloom weaves, just off the loom' },
  'On Sale': { emoji: '🎉', title: 'On Sale', subtitle: 'Exclusive savings on premium handloom sarees.' },
  'All Collections': { emoji: '❤️', title: 'All Collections', subtitle: 'Authentic handloom sarees from master weavers' },
}

export default function CollectionsHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji?: string
  title: string
  subtitle?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cats = searchParams.getAll('category')
  const search = (searchParams.get('search') || '').trim()

  // When a search is active, keep showing the origin page's own hero (resolved
  // from ?from=, falling back to this listing's own props / All Collections).
  const originHero = PAGE_HEROES[searchParams.get('from') || ''] || {
    emoji: emoji || '❤️', title, subtitle: subtitle || '',
  }

  // On an explicit submit (Enter / search icon) the URL carries h=cat, and the
  // hero shows the matched item's CATEGORY instead of the origin page hero. The
  // category comes from ?hc= when known (no flicker); otherwise we resolve it
  // from the top search match.
  const showCat = !!search && searchParams.get('h') === 'cat'
  const hcParam = searchParams.get('hc') || ''
  const [fetchedCat, setFetchedCat] = useState('')
  useEffect(() => {
    if (!showCat || hcParam) { setFetchedCat(''); return }
    let cancelled = false
    fetch(`/api/search?query=${encodeURIComponent(search)}&limit=1`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setFetchedCat(d.items?.[0]?.category || '') })
      .catch(() => {})
    return () => { cancelled = true }
  }, [showCat, hcParam, search])
  const searchCat = hcParam || fetchedCat

  const removeCat = (c: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const remaining = params.getAll('category').filter((x) => x !== c)
    params.delete('category')
    remaining.forEach((v) => params.append('category', v))
    const qs = params.toString()
    router.push(qs ? `/products?${qs}` : '/products')
  }

  const clearAll = () => router.push('/products')

  return (
    <section className="bg-[#4E1E24] text-white py-1.5 md:py-6">
      <div className="container mx-auto px-4 text-center">
        {cats.length >= 2 ? (
          /* Multiple categories — removable chips + Clear All */
          <div className="flex flex-wrap items-center justify-center gap-2">
            {cats.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-[#F4E5C2] text-[#4E1E24] rounded-full pl-3 pr-1.5 py-1 text-xs md:text-sm font-medium"
              >
                {titleCase(c)}
                <button
                  onClick={() => removeCat(c)}
                  aria-label={`Remove ${titleCase(c)}`}
                  className="hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAll}
              className="text-xs md:text-sm font-semibold text-[#F4E5C2] underline underline-offset-2 ml-1"
            >
              Clear All
            </button>
          </div>
        ) : cats.length === 1 ? (
          /* Single category — show its name as the heading */
          <h1
            className="text-sm md:text-2xl font-bold text-[#F4E5C2]"
            style={{ fontFamily: 'var(--font-kurale), serif' }}
          >
            {titleCase(cats[0])}
          </h1>
        ) : showCat && searchCat ? (
          /* Explicit submit — show the matched item's CATEGORY as the heading. */
          <h1
            className="text-sm md:text-2xl font-bold text-[#F4E5C2]"
            style={{ fontFamily: 'var(--font-kurale), serif' }}
          >
            {titleCase(searchCat)}
          </h1>
        ) : search ? (
          /* Live search — keep the full hero of the page the search came from
             (emoji + title + subtitle + lotus), never the raw typed term. */
          <>
            <div className="hidden md:flex justify-center mb-1.5">
              <LotusAccent width={26} color="#F4C430" />
            </div>
            <h1
              className="text-sm md:text-2xl font-bold text-[#F4E5C2] inline-flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-kurale), serif' }}
            >
              {originHero.emoji && <span className="text-[0.8em] leading-none">{originHero.emoji}</span>}
              {originHero.title}
            </h1>
            {originHero.subtitle && <p className="text-[#E8DCC7] text-xs md:text-sm mt-0.5 md:mt-2 max-w-xl mx-auto">{originHero.subtitle}</p>}
          </>
        ) : (
          /* Default — All Collections + tagline */
          <>
            <div className="hidden md:flex justify-center mb-1.5">
              <LotusAccent width={26} color="#F4C430" />
            </div>
            <h1
              className="text-sm md:text-2xl font-bold text-[#F4E5C2] inline-flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-kurale), serif' }}
            >
              {emoji && <span className="text-[0.8em] leading-none">{emoji}</span>}
              {title}
            </h1>
            {subtitle && <p className="text-[#E8DCC7] text-xs md:text-sm mt-0.5 md:mt-2 max-w-xl mx-auto">{subtitle}</p>}
          </>
        )}
      </div>
    </section>
  )
}
