'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice, getStockStatus } from '@/lib/utils'
import { PlusCircle, Pencil, Trash2, Package, Loader2, Search, Eye, Power } from 'lucide-react'
import { toast } from 'sonner'
import Pagination from '@/components/admin/Pagination'
import { useAdminPrefs } from '@/lib/admin-prefs'
import { useHighlight, HIGHLIGHT_RING } from '@/lib/use-highlight'
import CategoryManager from '@/components/admin/CategoryManager'
import { Tags } from 'lucide-react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [threshold, setThreshold] = useState(3)
  const [categoryMgrOpen, setCategoryMgrOpen] = useState(false)
  const [prefs] = useAdminPrefs()
  const PAGE_SIZE = prefs.dashboard.rowsPerPage
  const highlight = useHighlight('/admin/products')

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then(({ products }) => { setProducts(products || []); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/admin/settings').then((r) => r.json()).then(({ settings }) => { if (settings?.low_stock_threshold != null) setThreshold(settings.low_stock_threshold) }).catch(() => {})
  }, [])

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'inactive' ? 'active' : 'inactive'
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, status: next } : x)))
    const res = await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (!res.ok) { toast.error('Update failed'); setProducts((p) => p.map((x) => (x.id === id ? { ...x, status: current as 'active' | 'inactive' } : x))) }
    else toast.success(next === 'active' ? 'Product activated' : 'Product deactivated')
  }

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      toast.success('Product deleted')
      setProducts((p) => p.filter((x) => x.id !== id))
    } else {
      toast.error('Failed to delete')
    }
  }

  const term = search.trim().toLowerCase()
  const matchesSearch = (p: Product) => {
    if (!term) return true
    const haystack = [
      p.code,
      p.name,
      p.description,
      p.fabric,
      p.category,
      p.region,
      ...(p.occasion || []),
      ...(p.color || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  }

  const filtered = products
    .filter((p) =>
      matchesSearch(p) &&
      (statusFilter === 'all' || (p.status ?? 'active') === statusFilter) &&
      (categoryFilter === 'all' || p.category === categoryFilter)
    )
    .sort((a, b) => {
      // Sort by the trailing number of the Product ID (XX-XX-XXXX → last digits),
      // ascending: 1, 2, 3 … Products without a numbered code fall to the end.
      const seqOf = (code?: string | null) => {
        const m = (code || '').match(/(\d+)(?!.*\d)/) // last run of digits
        return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY
      }
      const na = seqOf(a.code)
      const nb = seqOf(b.code)
      if (na !== nb) return na - nb
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(1, pageCount))

  // Jump to the page holding a highlighted (searched) product so it's visible.
  useEffect(() => {
    if (!highlight) return
    const t = setTimeout(() => {
      const idx = filtered.findIndex((p) => p.id === highlight)
      if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1)
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, filtered.length, PAGE_SIZE])
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-row items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Products</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setCategoryMgrOpen(true)} className="inline-flex items-center justify-center gap-1.5 border border-[#AD1457] text-[#AD1457] hover:bg-[#AD1457]/5 font-semibold text-xs px-2.5 py-1.5 sm:text-sm sm:px-3.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap">
            <Tags className="h-4 w-4" /> Add New Category
          </button>
          <Link href="/admin/products/new">
            <span className="inline-flex items-center justify-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-xs px-2.5 py-1.5 sm:text-sm sm:px-3.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap">
              <PlusCircle className="h-4 w-4" /> Add New Product
            </span>
          </Link>
        </div>
      </div>

      {categoryMgrOpen && <CategoryManager onClose={() => setCategoryMgrOpen(false)} />}

      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mb-2 sm:mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, fabric, category, description..."
            className="w-full h-9 sm:h-10 pl-8 sm:pl-10 pr-2 sm:pr-3 rounded-lg border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 sm:contents">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'inactive'); setPage(1) }} className="h-9 sm:h-10 rounded-lg border border-gray-200 px-1.5 sm:px-3 text-xs sm:text-sm bg-white capitalize flex-1 sm:flex-none sm:flex-shrink-0">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="h-9 sm:h-10 rounded-lg border border-gray-200 px-1.5 sm:px-3 text-xs sm:text-sm bg-white capitalize flex-1 sm:flex-none sm:flex-shrink-0">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products yet. Add your first saree!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((p) => (
            <div key={p.id} data-hl={p.id} className={`bg-white rounded-lg border border-gray-100 p-2.5 transition-shadow overflow-x-auto md:overflow-visible ${highlight === p.id ? HIGHLIGHT_RING : ''}`}>
              <div className="flex items-center gap-3 min-w-max md:min-w-0">
                <div className="relative w-11 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="44px" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xl">🥻</div>}
                </div>
                <div className="flex-shrink-0 md:flex-1 md:min-w-0">
                  {p.code && (
                    <p className="text-[11px] font-mono font-semibold text-[#AD1457] tracking-wide">ID: {p.code}</p>
                  )}
                  <p className="font-semibold text-gray-900 text-sm md:line-clamp-1 whitespace-nowrap md:whitespace-normal">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-nowrap whitespace-nowrap md:flex-wrap">
                    <span className="text-xs text-gray-500 capitalize">{p.category} • {p.fabric}</span>
                    <span className="text-sm font-bold text-[#AD1457]">{formatPrice(p.price)}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Stock: {p.stock_quantity}</span>
                    {(() => {
                      const s = getStockStatus(p.stock_quantity, threshold)
                      const cls = s.level === 'in' ? 'bg-green-50 text-green-600' : s.level === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{s.label}</span>
                    })()}
                    {p.is_new_arrival && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">New</span>}
                    {p.is_best_seller && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Best Seller</span>}
                    {(p.status ?? 'active') === 'inactive'
                      ? <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                      : <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleStatus(p.id, p.status ?? 'active')} className={`p-1.5 rounded-md transition-colors ${(p.status ?? 'active') === 'inactive' ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-green-600 hover:bg-green-50'}`} title={(p.status ?? 'active') === 'inactive' ? 'Activate' : 'Deactivate'}>
                    <Power className="h-4 w-4" />
                  </button>
                  <Link href={`/products/${p.id}`} target="_blank" className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="View on store">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link href={`/admin/products/${p.id}/edit`} className="p-1.5 text-gray-500 hover:text-[#AD1457] hover:bg-rose-50 rounded-md transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {p.color_variants?.length > 0 && (
                <div className="flex flex-nowrap min-w-max gap-1.5 mt-2 pt-2 border-t border-gray-50 md:flex-wrap md:min-w-0">
                  {p.color_variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-50 rounded-full pl-1 pr-2 py-0.5 flex-shrink-0">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {v.image ? <Image src={v.image} alt="" fill className="object-cover" sizes="20px" /> : null}
                      </div>
                      <span className="text-[11px] text-gray-700">{idx + 1}</span>
                      <span className="text-[11px] font-bold text-[#AD1457]">×{v.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
