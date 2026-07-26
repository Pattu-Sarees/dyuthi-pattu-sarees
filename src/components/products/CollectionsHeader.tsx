'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import LotusAccent from '@/components/ui/LotusAccent'

const titleCase = (s: string) =>
  s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

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

  // Resolve the matched products' category so the heading shows e.g. "Kuppadam"
  // (the category) rather than the raw typed term. Uses the most common category
  // among the matches.
  const [searchCat, setSearchCat] = useState('')
  useEffect(() => {
    if (!search) { setSearchCat(''); return }
    let cancelled = false
    fetch(`/api/products?search=${encodeURIComponent(search)}&limit=60`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const counts = new Map<string, number>()
        let top = ''
        let topN = 0
        for (const p of (d.products || []) as { category?: string }[]) {
          const c = (p.category || '').trim().toLowerCase()
          if (!c) continue
          const n = (counts.get(c) || 0) + 1
          counts.set(c, n)
          if (n > topN) { topN = n; top = c }
        }
        setSearchCat(top)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [search])

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
        ) : search ? (
          /* Search — show the matched product category (fallback: the term) */
          <h1
            className="text-sm md:text-2xl font-bold text-[#F4E5C2]"
            style={{ fontFamily: 'var(--font-kurale), serif' }}
          >
            {titleCase(searchCat || search)}
          </h1>
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
