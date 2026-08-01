'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { InventoryRow, StockMovement, STOCK_REASONS, LOW_STOCK_THRESHOLD } from '@/types'
import { Loader2, Boxes, X, History, Plus, Minus, Pencil, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { toast } from 'sonner'
import Pagination from '@/components/admin/Pagination'
import { useAdminPrefs } from '@/lib/admin-prefs'
import { useHighlight } from '@/lib/use-highlight'

type StockFilter = 'all' | 'in' | 'low' | 'out'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

// Live low-stock threshold from Settings (defaults to the constant until loaded).
let LOW = LOW_STOCK_THRESHOLD

// Per-colour stock status: a single sold-out colour marks the product as having
// an out-of-stock item, even if other colours still have pieces.
function colourStatus(it: InventoryRow) {
  const vs = it.variants || []
  if (vs.length === 0) {
    const q = it.stock_quantity
    return {
      out: q <= 0,
      low: q > 0 && q <= LOW,
      inStock: q > LOW,
      outCount: 0,
      lowCount: 0,
      inCount: 0,
    }
  }
  const outCount = vs.filter((v) => v.quantity <= 0).length
  const lowCount = vs.filter((v) => v.quantity > 0 && v.quantity <= LOW).length
  const inCount = vs.filter((v) => v.quantity > LOW).length
  return { out: outCount > 0, low: lowCount > 0, inStock: inCount > 0, outCount, lowCount, inCount }
}

// Variants matching a given filter (for the per-status gallery popup).
function variantsForFilter(it: InventoryRow, filter: StockFilter) {
  if (filter === 'low') return it.variants.filter((v) => v.quantity > 0 && v.quantity <= LOW)
  if (filter === 'out') return it.variants.filter((v) => v.quantity <= 0)
  if (filter === 'in') return it.variants.filter((v) => v.quantity > LOW)
  return it.variants
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StockFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [prefs] = useAdminPrefs()
  const PAGE_SIZE = prefs.dashboard.rowsPerPage
  const highlight = useHighlight('/admin/inventory')
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null)
  const [initialVariant, setInitialVariant] = useState<string | null>(null)
  const [historyFor, setHistoryFor] = useState<InventoryRow | null>(null)
  const [gallery, setGallery] = useState<{ title: string; variants: InventoryRow['variants'] } | null>(null)
  const [, setThresholdTick] = useState(0)
  const deepLinkHandled = useRef(false)

  // Load the live low-stock threshold from Settings.
  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then(({ settings }) => {
      if (settings?.low_stock_threshold != null) { LOW = settings.low_stock_threshold; setThresholdTick((t) => t + 1) }
    }).catch(() => {})
  }, [])

  // Every unique colour image — pre-warmed below so previews open instantly.
  const allImages = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.variants.map((v) => v.image)).filter(Boolean))),
    [items],
  )

  const load = () => {
    fetch('/api/admin/inventory').then((r) => r.json()).then(({ items }) => {
      const list: InventoryRow[] = items || []
      setItems(list)
      setLoading(false)
      // Deep-link from a product's "Update in Inventory" link: ?adjust=<id>&variant=<image>
      if (!deepLinkHandled.current) {
        deepLinkHandled.current = true
        const params = new URLSearchParams(window.location.search)
        const adjustId = params.get('adjust')
        if (adjustId) {
          const match = list.find((i) => i.id === adjustId)
          if (match) {
            setInitialVariant(params.get('variant'))
            setAdjusting(match)
          }
          // Clean the URL so a refresh doesn't reopen the modal.
          window.history.replaceState(null, '', '/admin/inventory')
        }
      }
    }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  // Search applies across every section; counts reflect the searched set.
  const searched = useMemo(() => {
    const term = search.trim().toLowerCase()
    const base = !term
      ? items
      : items.filter((i) =>
          [i.name, i.fabric, i.category, i.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term),
        )
    return [...base].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [items, search])

  const counts = useMemo(() => ({
    all: searched.length,
    in: searched.filter((i) => colourStatus(i).inStock).length,
    low: searched.filter((i) => colourStatus(i).low).length,
    out: searched.filter((i) => colourStatus(i).out).length,
  }), [searched])

  const filtered = useMemo(() => {
    if (filter === 'in') return searched.filter((i) => colourStatus(i).inStock)
    if (filter === 'low') return searched.filter((i) => colourStatus(i).low)
    if (filter === 'out') return searched.filter((i) => colourStatus(i).out)
    return searched
  }, [searched, filter])

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(1, pageCount))
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Jump to the page holding a highlighted (searched) product so it's visible.
  useEffect(() => {
    if (!highlight) return
    const t = setTimeout(() => {
      const idx = filtered.findIndex((i) => i.id === highlight)
      if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1)
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, filtered.length, PAGE_SIZE])

  const onAdjusted = (id: string, stock_quantity: number, in_stock: boolean, variants?: InventoryRow['variants']) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, stock_quantity, in_stock, ...(variants ? { variants } : {}) } : i)))
    setAdjusting((cur) => (cur && cur.id === id ? { ...cur, stock_quantity, in_stock, ...(variants ? { variants } : {}) } : cur))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Inventory</h1>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex flex-nowrap overflow-x-auto gap-1.5 sm:flex-wrap sm:gap-2.5">
          <Chip scheme="all" active={filter === 'all'} count={counts.all} onClick={() => { setFilter('all'); setPage(1) }}>All</Chip>
          <Chip scheme="in" active={filter === 'in'} count={counts.in} onClick={() => { setFilter('in'); setPage(1) }}>In Stock</Chip>
          <Chip scheme="low" active={filter === 'low'} count={counts.low} onClick={() => { setFilter('low'); setPage(1) }}>Low Stock</Chip>
          <Chip scheme="out" active={filter === 'out'} count={counts.out} onClick={() => { setFilter('out'); setPage(1) }}>Out Of Stock</Chip>
        </div>
        <div className="relative w-full sm:w-96 sm:ml-auto sm:flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, fabric, category, description..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white"
          />
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Boxes className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Category</th>
                <th className="py-3 px-2 font-medium text-right">In stock</th>
                <th className="py-3 px-2 font-medium text-right hidden md:table-cell">Sold</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it) => {
                const st = colourStatus(it)
                const out = it.stock_quantity <= 0
                const low = !out && it.stock_quantity <= LOW
                return (
                  <tr key={it.id} data-hl={it.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 align-top ${highlight === it.id ? 'outline outline-2 -outline-offset-2 outline-red-500' : ''}`}>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                          {it.image && <Image src={it.image} alt={it.name} fill className="object-cover" sizes="40px" />}
                        </div>
                        <div className="min-w-0">
                          {filter === 'all' ? (
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{it.name}</p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const vs = variantsForFilter(it, filter)
                                if (vs.length > 0) setGallery({ title: it.name, variants: vs })
                              }}
                              className="font-medium text-[#4E1E24] hover:text-[#AD1457] hover:underline truncate max-w-[200px] text-left block"
                              title="Browse items"
                            >
                              {it.name}
                            </button>
                          )}
                          {it.status === 'inactive' && <span className="text-[10px] text-gray-400">inactive</span>}
                        </div>
                      </div>
                      {/* Per-colour stock badges */}
                      {it.variants.length > 0 && (
                        <div className="flex flex-nowrap gap-1 mt-1.5 md:flex-wrap md:gap-1.5">
                          {it.variants.map((v, idx) => {
                            const vOut = v.quantity <= 0
                            const vLow = !vOut && v.quantity <= LOW
                            // Under In/Low/Out filters, only show the matching colours.
                            const vIn = !vOut && !vLow
                            if (filter === 'in' && !vIn) return null
                            if (filter === 'low' && !vLow) return null
                            if (filter === 'out' && !vOut) return null
                            const cls = vOut ? 'bg-red-50 text-red-600 border-red-200' : vLow ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'
                            const label = vOut ? 'Out' : vLow ? 'Low' : 'In'
                            return (
                              <span
                                key={v.image}
                                className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-full border pl-0.5 pr-1.5 sm:pl-1 sm:pr-2 py-0.5 text-[10px] sm:text-[11px] whitespace-nowrap flex-shrink-0 ${cls}`}
                                title={vOut ? 'Out of stock' : vLow ? 'Low stock' : 'In stock'}
                              >
                                <span className="relative h-4 w-4 rounded-full overflow-hidden bg-gray-200">
                                  {v.image && <Image src={v.image} alt="" fill className="object-cover" sizes="16px" />}
                                </span>
                                <span className="font-medium">{idx + 1}</span>
                                {!vOut && <span className="tabular-nums">×{v.quantity}</span>}
                                <span className="font-semibold">{label}</span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-500 capitalize hidden sm:table-cell">{it.category}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-gray-800'}`}>
                        {(out || low) && <AlertTriangle className="h-3.5 w-3.5" />}
                        {it.stock_quantity}
                      </span>
                      {st.outCount > 0 && <p className="text-[10px] text-red-600 mt-0.5">{st.outCount} colour{st.outCount > 1 ? 's' : ''} out</p>}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-500 tabular-nums hidden md:table-cell">{it.sold_count}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setAdjusting(it)} className="inline-flex items-center gap-1 text-xs font-medium text-[#AD1457] hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Pencil className="h-3.5 w-3.5" /> Adjust
                        </button>
                        <button onClick={() => setHistoryFor(it)} className="p-1.5 text-gray-400 hover:text-[#AD1457] hover:bg-rose-50 rounded-lg transition-colors" title="History">
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pre-warm colour images off-screen so the gallery opens instantly */}
      <div aria-hidden className="fixed -left-[9999px] top-0 pointer-events-none" style={{ visibility: 'hidden' }}>
        {allImages.map((src) => (
          <div key={src} className="relative h-80 w-80">
            <Image src={src} alt="" fill quality={85} sizes="448px" loading="eager" />
          </div>
        ))}
      </div>

      {/* Items gallery (opened from the product name; shows the filtered status's items) */}
      {gallery && <GalleryModal title={gallery.title} variants={gallery.variants} onClose={() => setGallery(null)} />}

      {adjusting && (
        <AdjustModal item={adjusting} initialVariant={initialVariant} onClose={() => { setAdjusting(null); setInitialVariant(null) }} onSaved={onAdjusted} />
      )}
      {historyFor && (
        <HistoryModal item={historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  )
}

function AdjustModal({ item, initialVariant, onClose, onSaved }: { item: InventoryRow; initialVariant?: string | null; onClose: () => void; onSaved: (id: string, q: number, inStock: boolean, variants?: InventoryRow['variants']) => void }) {
  const hasVariants = item.variants.length > 0
  // selected colour image, or null for whole-product (no variants). Honour a
  // deep-linked variant when it exists on this product.
  const deepLinked = initialVariant && item.variants.some((v) => v.image === initialVariant) ? initialVariant : null
  const [selected, setSelected] = useState<string | null>(hasVariants ? (deepLinked ?? item.variants[0].image) : null)
  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<string>('restock')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const currentQty = hasVariants
    ? (item.variants.find((v) => v.image === selected)?.quantity ?? 0)
    : item.stock_quantity

  const preview = useMemo(() => {
    const n = Number(amount)
    // Don't project a new level for empty, invalid, or negative input.
    if (!Number.isFinite(n) || amount === '' || n < 0) return currentQty
    if (mode === 'add') return currentQty + Math.round(n)
    if (mode === 'subtract') return Math.max(0, currentQty - Math.round(n))
    return Math.max(0, Math.round(n))
  }, [amount, mode, currentQty])

  // Live-projected total (selected colour swapped for its new level) for the header.
  const projectedTotal = hasVariants ? Math.max(0, item.stock_quantity - currentQty + preview) : preview
  const totalChanged = projectedTotal !== item.stock_quantity
  // Projected per-colour quantity for the row badges.
  const projectedQtyFor = (image: string) => (image === selected ? preview : (item.variants.find((v) => v.image === image)?.quantity ?? 0))

  // Inline validation:
  //  - block negatives (including "-0")
  //  - Add/Remove require at least 1 (0 does nothing)
  //  - Set to allows 0 (sets the quantity to 0 / out of stock)
  //  - Remove cannot exceed what's currently available
  const validationError = useMemo(() => {
    if (amount === '') return ''
    const raw = amount.trim()
    const n = Number(raw)
    if (!Number.isFinite(n)) return 'Enter a valid number'
    if (raw.includes('-')) return 'Cannot be a negative value'
    const rounded = Math.round(n)
    if ((mode === 'add' || mode === 'subtract') && rounded === 0) return 'Quantity must be at least 1'
    if (mode === 'subtract' && rounded > currentQty) return `Cannot remove more than available (${currentQty})`
    return ''
  }, [amount, mode, currentQty])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validationError) { toast.error(validationError); return }
    // Nothing entered, or the entry doesn't change the current quantity → just close.
    if (amount === '' || preview === currentQty) {
      toast('No updates to save', { icon: 'ℹ️' })
      onClose()
      return
    }
    const n = Number(amount)
    setSaving(true)
    const res = await fetch(`/api/admin/inventory/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantImage: hasVariants ? selected : undefined, mode, amount: n, reason, note }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed' }))
      toast.error(error || 'Failed')
      return
    }
    const data = await res.json()
    if (hasVariants) {
      const variants = item.variants.map((v) => (v.image === selected ? { ...v, quantity: data.variantQty } : v))
      onSaved(item.id, data.stock_quantity, data.in_stock, variants)
      toast.success(data.unchanged ? 'No change' : 'Colour stock updated')
    } else {
      onSaved(item.id, data.stock_quantity, data.in_stock)
      toast.success('Stock updated')
    }
    onClose()
  }

  const modeBtn = (m: 'add' | 'subtract' | 'set', label: string, Icon: typeof Plus) => (
    <button type="button" onClick={() => setMode(m)} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === m ? 'bg-[#AD1457] text-white border-[#AD1457]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#AD1457]'}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#4E1E24]">Adjust Stock</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4 truncate">
          {item.name} · total <span className={`font-semibold ${totalChanged ? 'text-[#AD1457]' : 'text-gray-700'}`}>{projectedTotal}</span>
          {totalChanged && <span className="text-gray-400"> (was {item.stock_quantity})</span>}
        </p>

        {/* Colour selector */}
        {hasVariants && (
          <div className="mb-4">
            <label className="text-[11px] text-gray-400">Select colour / item</label>
            <div className="mt-1.5 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {item.variants.map((v, i) => {
                const active = v.image === selected
                const shownQty = projectedQtyFor(v.image)
                const changed = shownQty !== v.quantity
                return (
                  <button
                    key={v.image}
                    type="button"
                    onClick={() => { setSelected(v.image); setAmount('') }}
                    className={`w-full flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${active ? 'border-[#AD1457] bg-rose-50/60' : 'border-gray-200 hover:border-[#AD1457]'}`}
                  >
                    <span className="w-5 text-center text-xs font-semibold text-gray-400">{i + 1}</span>
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      <Image src={v.image} alt={`Colour ${i + 1}`} fill className="object-cover" sizes="40px" />
                    </div>
                    <span className="flex-1 text-sm text-gray-600">Colour {i + 1}</span>
                    <span className={`text-sm font-bold tabular-nums ${changed ? 'text-[#AD1457]' : shownQty <= 0 ? 'text-red-600' : shownQty <= LOW ? 'text-amber-600' : 'text-gray-800'}`}>×{shownQty}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            {modeBtn('add', 'Add', Plus)}
            {modeBtn('subtract', 'Remove', Minus)}
            {modeBtn('set', 'Set to', Pencil)}
          </div>
          <input
            type="number"
            min={mode === 'set' ? 0 : 1}
            max={mode === 'subtract' ? currentQty : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={mode === 'subtract' ? `Quantity (max ${currentQty})` : 'Quantity'}
            className={`${input} ${validationError ? 'border-red-400 focus:ring-red-300' : ''}`}
            autoFocus
          />
          {validationError && <p className="text-xs text-red-600 -mt-1.5">{validationError}</p>}

          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
            <span className="text-gray-500">{hasVariants ? 'New colour level' : 'New stock level'}</span>
            <span className="font-bold text-[#4E1E24] tabular-nums">{currentQty} → {preview}</span>
          </div>

          <div>
            <label className="text-[11px] text-gray-400">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={input}>
              {STOCK_REASONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Description / note (optional)" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />

          <button type="submit" disabled={saving || !!validationError} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Adjustment'}
          </button>
        </form>
      </div>
    </div>
  )
}

function HistoryModal({ item, onClose }: { item: InventoryRow; onClose: () => void }) {
  const [movements, setMovements] = useState<StockMovement[] | null>(null)

  useEffect(() => {
    fetch(`/api/admin/inventory/${item.id}`).then((r) => r.json()).then(({ movements }) => setMovements(movements || [])).catch(() => setMovements([]))
  }, [item.id])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#4E1E24]">Stock History</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4 truncate">{item.name}</p>

        {movements === null ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#AD1457]" /></div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No adjustments recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 border-b border-gray-50 last:border-0 pb-2">
                <div className="flex items-start gap-2 min-w-0">
                  {m.variant_image && (
                    <div className="relative h-8 w-8 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 mt-0.5" title="Colour adjusted">
                      <Image src={m.variant_image} alt="" fill className="object-cover" sizes="32px" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold tabular-nums ${m.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{m.change >= 0 ? '+' : ''}{m.change}</span>
                      <span className="text-xs capitalize bg-rose-50 text-[#AD1457] px-2 py-0.5 rounded-full">{m.reason}</span>
                      <span className="text-xs text-gray-400">→ {m.resulting_quantity}</span>
                    </div>
                    {m.note && <p className="text-xs text-gray-600 mt-0.5">{m.note}</p>}
                    {m.created_by && <p className="text-[11px] text-gray-400 mt-0.5">{m.created_by}</p>}
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Popup that browses a list of colour items one at a time, with prev/next arrows.
function GalleryModal({ title, variants, onClose }: { title: string; variants: InventoryRow['variants']; onClose: () => void }) {
  const vs = variants
  const [index, setIndex] = useState(0)
  const prev = () => setIndex((i) => (i - 1 + vs.length) % vs.length)
  const next = () => setIndex((i) => (i + 1) % vs.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vs.length])

  const v = vs[index]
  const vOut = v.quantity <= 0
  const vLow = !vOut && v.quantity <= LOW
  const statusCls = vOut ? 'bg-red-50 text-red-600' : vLow ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
  const statusLabel = vOut ? 'Out of stock' : vLow ? 'Low stock' : 'In stock'

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="font-semibold text-[#4E1E24] truncate">{title}</p>
            <p className="text-[11px] text-gray-400">Item {index + 1} of {vs.length}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="relative bg-gray-100" style={{ height: '20rem' }}>
          {v.image && <Image src={v.image} alt={`Colour ${index + 1}`} fill quality={85} className="object-contain" sizes="448px" />}
          {vs.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md text-gray-700"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md text-gray-700"><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Colour {index + 1}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-gray-800">×{v.quantity}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {vs.length > 1 && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
            {vs.map((t, i) => (
              <button key={t.image} onClick={() => setIndex(i)} className={`relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden border-2 ${i === index ? 'border-[#AD1457]' : 'border-transparent'}`}>
                {t.image && <Image src={t.image} alt="" fill className="object-cover" sizes="48px" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Outline + count badge. Text stays black; the count badge uses the same colours
// as the per-colour status badges (green = In, orange = Low, red = Out).
const CHIP_SCHEMES: Record<'all' | 'in' | 'low' | 'out', { border: string; badge: string; activeBg: string }> = {
  all: { border: 'border-[#4E1E24]/30', badge: 'bg-[#4E1E24]', activeBg: 'bg-[#4E1E24]/5' },
  in: { border: 'border-green-300', badge: 'bg-green-600', activeBg: 'bg-green-50' },
  low: { border: 'border-orange-300', badge: 'bg-orange-500', activeBg: 'bg-orange-50' },
  out: { border: 'border-red-300', badge: 'bg-red-500', activeBg: 'bg-red-50' },
}

function Chip({ scheme, active, count, onClick, children }: { scheme: 'all' | 'in' | 'low' | 'out'; active: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  const s = CHIP_SCHEMES[scheme]
  const activeAll = active && scheme === 'all' // 'All' fills solid maroon when selected
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 sm:gap-2 rounded-full border pl-2.5 pr-1 py-0.5 sm:pl-4 sm:pr-1.5 sm:py-1 text-xs sm:text-sm font-normal whitespace-nowrap flex-shrink-0 transition-colors ${s.border} ${activeAll ? 'bg-[#4E1E24] border-transparent text-white' : `text-gray-900 ${active ? s.activeBg : 'bg-white'}`}`}
    >
      {children}
      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 sm:px-1.5 rounded-full text-white text-[10px] sm:text-xs font-bold ${activeAll ? 'bg-white/25' : s.badge}`}>{count}</span>
    </button>
  )
}
