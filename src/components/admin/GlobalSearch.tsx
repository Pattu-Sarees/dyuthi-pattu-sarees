'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Clock, X, Package, Boxes, ShoppingCart, UserCircle, Users, Ticket } from 'lucide-react'

interface Hit { id: string; label: string; sub?: string; image?: string | null; link: string }
type Results = Partial<Record<'products' | 'inventory' | 'orders' | 'customers' | 'leads' | 'coupons', Hit[]>>

const GROUPS: { key: keyof Results; label: string; icon: typeof Package }[] = [
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'customers', label: 'Customers', icon: UserCircle },
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'coupons', label: 'Coupons', icon: Ticket },
]

const RECENT_KEY = 'admin_recent_searches'

export default function GlobalSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Results>({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')) } catch {}
    }, 0)
    return () => clearTimeout(id)
  }, [])

  // Close on outside click.
  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Debounced search (300ms). All setState runs inside the timeout callback.
  useEffect(() => {
    const term = q.trim()
    const t = setTimeout(() => {
      if (term.length < 1) { setResults({}); setLoading(false); return }
      setLoading(true)
      fetch(`/api/admin/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then(({ results }) => setResults(results || {}))
        .catch(() => setResults({}))
        .finally(() => setLoading(false))
    }, term.length < 1 ? 0 : 300)
    return () => clearTimeout(t)
  }, [q])

  const saveRecent = (term: string) => {
    const t = term.trim()
    if (!t) return
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6)
    setRecent(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }
  const clearRecent = () => { setRecent([]); localStorage.removeItem(RECENT_KEY) }

  const go = (hit: Hit) => { saveRecent(q); setOpen(false); setQ(''); router.push(hit.link) }

  const total = GROUPS.reduce((n, g) => n + (results[g.key]?.length || 0), 0)
  const showRecent = q.trim().length === 0 && recent.length > 0

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0 max-w-md mx-auto block">
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FBF7F0] border border-[#ece3d6] rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2">
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products, orders, customers…"
          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-gray-700 placeholder:text-gray-400 placeholder:truncate focus:outline-none"
        />
        {loading ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" /> : q && <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
      </div>

      {open && (q.trim().length > 0 || showRecent) && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {showRecent ? (
            <div className="py-1">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[11px] uppercase tracking-wide text-gray-400">Recent searches</span>
                <button onClick={clearRecent} className="text-[11px] text-gray-400 hover:text-[#AD1457]">Clear</button>
              </div>
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  <Clock className="h-3.5 w-3.5 text-gray-400" /> {r}
                </button>
              ))}
            </div>
          ) : loading && total === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
          ) : total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No results for “{q.trim()}”</p>
          ) : (
            <div className="py-1">
              {GROUPS.map((g) => {
                const hits = results[g.key] || []
                if (hits.length === 0) return null
                const Icon = g.icon
                return (
                  <div key={g.key}>
                    <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 text-[11px] uppercase tracking-wide text-gray-400"><Icon className="h-3 w-3" /> {g.label}</div>
                    {hits.map((h) => (
                      <button key={`${g.key}-${h.id}`} onClick={() => go(h)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                        {h.image !== undefined && (
                          <span className="relative h-8 w-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {h.image ? <Image src={h.image} alt="" fill className="object-cover" sizes="32px" /> : <Icon className="h-4 w-4 text-gray-300 m-auto" />}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm text-gray-800 truncate">{h.label}</span>
                          {h.sub && <span className="block text-xs text-gray-400 truncate capitalize">{h.sub}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
