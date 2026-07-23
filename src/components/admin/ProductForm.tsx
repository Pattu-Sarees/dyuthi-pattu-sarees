'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Product, InventoryItem, Vendor } from '@/types'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, ImagePlus, ChevronDown, Search } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/lib/categories'

const CATEGORIES = PRODUCT_CATEGORIES
const FABRICS = ['pure silk', 'blended silk', 'cotton', 'soft silk', 'linen']

// A row in the form. `isNew` marks photos/colours added during this edit —
// their quantity is editable (first-time stock entry). Existing rows are locked.
type Row = InventoryItem & { isNew?: boolean }

// Handle old data shapes gracefully
function normalise(variants?: Array<Partial<InventoryItem> & { image?: string; images?: string[] }>): Row[] {
  if (!variants?.length) return []
  return variants.flatMap((v) => {
    const flags = {
      is_new_arrival: !!v.is_new_arrival,
      is_best_seller: !!v.is_best_seller,
      additional_images: Array.isArray(v.additional_images) ? v.additional_images : [],
    }
    if (v.image) return [{ image: v.image, quantity: Number(v.quantity) || 1, ...flags }]
    if (v.images?.length) return v.images.map((img) => ({ image: img, quantity: Number(v.quantity) || 1, ...flags }))
    return []
  })
}

// Searchable vendor dropdown — stays usable as the vendor list grows.
function VendorSelect({ vendors, value, onChange }: {
  vendors: Vendor[]
  value: string
  onChange: (vendor: Vendor | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = vendors.find((v) => v.id === value)
  const filtered = query
    ? vendors.filter((v) => v.vendor_name.toLowerCase().includes(query.toLowerCase()))
    : vendors

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery('') }}
        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#C2185B] bg-white"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.vendor_name : 'Select vendor…'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors…"
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">
                {vendors.length === 0 ? 'No active vendors. Add one in the Vendors module.' : 'No vendors match your search.'}
              </p>
            ) : filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { onChange(v); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-rose-50 transition-colors ${v.id === value ? 'bg-rose-50 text-[#AD1457] font-semibold' : 'text-gray-700'}`}
              >
                {v.vendor_name}
                {v.notes && <span className="block text-xs text-gray-400 line-clamp-1">{v.notes}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    original_price: product?.original_price?.toString() || '',
    category: product?.category || 'kanjivaram',
    fabric: product?.fabric || 'pure silk',
    region: product?.region || '',
    occasion: product?.occasion?.join(', ') || '',
    status: product?.status ?? 'active',
    vendor_id: product?.vendor_id || '',
    purchase_cost: product?.purchase_cost?.toString() || '',
    purchase_date: product?.purchase_date || '',
    invoice_number: product?.invoice_number || '',
    procurement_notes: product?.procurement_notes || '',
    video_watermark: product?.video_watermark ?? '',
    video_url: product?.video_url || '',
  })
  const [vendors, setVendors] = useState<Vendor[]>([])

  // Active vendors for the procurement dropdown
  useEffect(() => {
    fetch('/api/admin/vendors?status=active')
      .then((r) => r.json())
      .then(({ vendors }) => setVendors(vendors || []))
      .catch(() => {})
  }, [])
  const [items, setItems] = useState<Row[]>(normalise(product?.color_variants))

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  // Pieces being added via brand-new colour rows in this edit session.
  const addedQty = items.reduce((s, it) => s + (it.isNew ? Number(it.quantity) || 0 : 0), 0)
  // Pieces removed by deleting existing rows (their original DB quantity).
  const currentImages = new Set(items.map((it) => it.image))
  const removedQty = normalise(product?.color_variants)
    .filter((v) => !currentImages.has(v.image))
    .reduce((s, v) => s + (Number(v.quantity) || 0), 0)

  // On new products, stock = sum of entered quantities. On edit, the Inventory
  // module owns the running total, so start from the product's authoritative
  // count and project the delta from added/removed colours.
  const currentStock = product?.stock_quantity ?? 0
  const totalStock = isEdit
    ? Math.max(0, currentStock - removedQty + addedQty)
    : items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  const stockChanged = isEdit && totalStock !== currentStock

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    const newRows: Row[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) newRows.push({ image: json.url, quantity: 1, isNew: true })
        else toast.error(json.error || 'Upload failed')
      } catch {
        toast.error('Upload failed')
      }
    }
    if (newRows.length) setItems((prev) => [...prev, ...newRows])
    setUploading(false)
    e.target.value = ''
  }

  const setQty = (i: number, qty: number) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, quantity: qty } : it)))

  const toggleFlag = (i: number, key: 'is_new_arrival' | 'is_best_seller', val: boolean) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))

  // Extra angle shots for one row — uploaded like main photos but stored on the row.
  const handleAddAngles = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) urls.push(json.url)
        else toast.error(json.error || 'Upload failed')
      } catch {
        toast.error('Upload failed')
      }
    }
    if (urls.length) {
      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, additional_images: [...(it.additional_images || []), ...urls] } : it)))
      toast.success(`${urls.length} additional photo${urls.length > 1 ? 's' : ''} added`)
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeAngle = (i: number, url: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, additional_images: (it.additional_images || []).filter((u) => u !== url) } : it)))

  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    if (!form.vendor_id) { toast.error('Vendor is required — select one in the Procurement section'); return }
    const clean = items.filter((it) => it.image).map((it) => ({ image: it.image, quantity: Number(it.quantity) || 0, is_new_arrival: !!it.is_new_arrival, is_best_seller: !!it.is_best_seller, additional_images: it.additional_images || [] }))
    if (clean.length === 0) { toast.error('Add at least one photo'); return }

    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: clean.reduce((s, it) => s + it.quantity, 0),
      color: [],
      color_variants: clean,
      occasion: form.occasion.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      images: clean.map((it) => it.image),
      vendor_id: form.vendor_id || null,
      purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      purchase_date: form.purchase_date || null,
      invoice_number: form.invoice_number.trim() || null,
      procurement_notes: form.procurement_notes.trim() || null,
      video_watermark: form.video_watermark.trim() || null,
      video_url: form.video_url.trim() || null,
    }

    const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)

    if (res.ok) {
      toast.success(isEdit ? 'Product updated!' : 'Product added!')
      router.push('/admin')
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to save')
    }
  }

  const label = 'block text-sm font-medium text-gray-700 mb-1.5'
  const input = 'w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Inventory */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Product</h2>
          <span className="text-sm font-semibold text-[#C2185B]">
            Total stock: {totalStock}
            {stockChanged && <span className="text-gray-400 font-normal"> (was {currentStock})</span>}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {isEdit
            ? 'Add new photos/colours and set their pieces here. To change the stock of an existing colour, use the Inventory module so the change is logged.'
            : 'Click “Add photos” — each photo becomes a numbered row. Set how many pieces you have of each (e.g. 4 of one, 3 of another).'}
        </p>

        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-gray-50 rounded-lg p-2.5">
                <span className="w-6 text-center text-sm font-bold text-gray-500 flex-shrink-0">{i + 1}</span>
                <div className="relative w-14 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                  <Image src={it.image} alt={`Item ${i + 1}`} fill className="object-cover" sizes="56px" />
                </div>
                {!isEdit || it.isNew ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Pieces</label>
                    <input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      className="w-20 h-9 px-2 text-center rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Pieces</span>
                    <span className="inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">{it.quantity}</span>
                    <Link href={`/admin/inventory?adjust=${product!.id}&variant=${encodeURIComponent(it.image)}`} className="text-[11px] font-medium text-[#AD1457] hover:underline">Update in Inventory</Link>
                  </div>
                )}
                {/* Per-item merchandising flags — same row */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!it.is_new_arrival} onChange={(e) => toggleFlag(i, 'is_new_arrival', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
                  <span className="text-xs text-gray-600">New Arrival</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!it.is_best_seller} onChange={(e) => toggleFlag(i, 'is_best_seller', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
                  <span className="text-xs text-gray-600">Best Seller</span>
                </label>
                <label className="text-xs font-medium text-[#AD1457] hover:underline cursor-pointer">
                  Add Additional Photos
                  <input type="file" accept="image/*" multiple onChange={(e) => handleAddAngles(i, e)} className="hidden" disabled={uploading} />
                </label>
                <button type="button" onClick={() => removeRow(i)} className="ml-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
                {(it.additional_images?.length || 0) > 0 && (
                  <div className="w-full flex flex-wrap items-center gap-2 pl-10">
                    <span className="text-[11px] text-gray-400">Angles:</span>
                    {it.additional_images!.map((url) => (
                      <div key={url} className="relative w-10 h-12 rounded-md overflow-hidden border border-gray-200 group/angle">
                        <Image src={url} alt="Additional angle" fill className="object-cover" sizes="40px" />
                        <button
                          type="button"
                          onClick={() => removeAngle(i, url)}
                          className="absolute inset-0 hidden group-hover/angle:flex items-center justify-center bg-black/50 text-white"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex items-center gap-2 cursor-pointer bg-[#C2185B] hover:bg-[#a01049] text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Add photos'}
          <input type="file" accept="image/*" multiple capture="environment" onChange={handleAddPhotos} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Product Details</h2>
        <div>
          <label className={label}>Saree Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="e.g. Mangalgiri Cotton Saree" required />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="Describe the saree, weave, border, occasion..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Price (₹) *</label>
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className={input} placeholder="2999" required />
          </div>
          <div>
            <label className={label}>Original Price (₹)</label>
            <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} className={input} placeholder="3999" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Fabric</label>
            <select value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={input}>
              {FABRICS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Region</label>
            <input value={form.region} onChange={(e) => set('region', e.target.value)} className={input} placeholder="e.g. mangalagiri" />
          </div>
          <div>
            <label className={label}>Occasions <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={input} placeholder="wedding, festival" />
          </div>
        </div>
        <div>
          <label className={label}>Video Watermark <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.video_watermark}
            onChange={(e) => set('video_watermark', e.target.value)}
            className={input}
            placeholder="www.srhandlooms.com"
          />
          <p className="text-xs text-gray-400 mt-1">
            Usually leave blank — videos are already watermarked before upload. Only fill this (e.g. www.srhandlooms.com) as a fallback if you uploaded a video without a burned-in watermark.
          </p>
        </div>
        <div>
          <label className={label}>Product Video <span className="text-gray-400 font-normal">(optional — opening video)</span></label>
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => set('video_url', e.target.value)}
            className={input}
            placeholder="Paste video link — e.g. https://videos.srhandlooms.com/gadwal.mp4 or a YouTube link"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload the compressed MP4 to Cloudflare R2 (or paste a YouTube link) and put the public URL here. Shown as a player on the product page. Leave blank for no video.
          </p>
        </div>
      </div>

      {/* Procurement */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Procurement</h2>
        <div>
          <label className={label}>Vendor Name *</label>
          <VendorSelect
            vendors={vendors}
            value={form.vendor_id}
            onChange={(vendor) => {
              setForm((f) => ({
                ...f,
                vendor_id: vendor?.id || '',
                // Auto-fill Procurement Notes from the vendor master (still editable)
                procurement_notes: vendor?.notes || f.procurement_notes,
              }))
            }}
          />
          <p className="text-xs text-gray-400 mt-1">
            Only active vendors are listed. Manage them in <Link href="/admin/vendors" className="text-[#AD1457] hover:underline">Vendors</Link>.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Purchase Cost (₹)</label>
            <input type="number" min={0} step="0.01" value={form.purchase_cost} onChange={(e) => set('purchase_cost', e.target.value)} className={input} placeholder="1500" />
          </div>
          <div>
            <label className={label}>Purchase Date</label>
            <input type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Bill / Invoice Number</label>
          <input value={form.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} className={input} placeholder="e.g. INV-2026-0142" />
        </div>
        <div>
          <label className={label}>Procurement Notes</label>
          <textarea
            value={form.procurement_notes}
            onChange={(e) => set('procurement_notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
            placeholder="Auto-fills from the vendor's notes — edit freely"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Visibility</h2>
        <div>
          <label className={label}>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={input}>
            <option value="active">Active — visible on store</option>
            <option value="inactive">Inactive — hidden from store</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">Mark items as <span className="font-medium text-gray-600">New Arrival</span> or <span className="font-medium text-gray-600">Best Seller</span> per photo in the Product section above.</p>
      </div>

      {/* Sticky submit */}
      <div className="sticky bottom-0 bg-gray-50 pt-3 -mx-4 px-4 pb-4 border-t border-gray-100">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button type="button" onClick={() => router.push('/admin')} className="px-5 h-12 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className="flex-1 h-12 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </form>
  )
}
