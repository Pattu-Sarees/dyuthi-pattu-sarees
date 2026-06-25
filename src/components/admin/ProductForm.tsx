'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Product, InventoryItem } from '@/types'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, ImagePlus } from 'lucide-react'

const CATEGORIES = ['mangalgiri', 'kuppadam', 'gadwal', 'kota', 'kanchipattu', 'soft silks', 'jamdhani', 'butter silk', 'green mango', 'lehengas', 'dress materials']
const FABRICS = ['pure silk', 'blended silk', 'cotton', 'soft silk', 'linen']

// Handle old data shapes gracefully
function normalise(variants?: Array<Partial<InventoryItem> & { image?: string; images?: string[] }>): InventoryItem[] {
  if (!variants?.length) return []
  return variants.flatMap((v) => {
    if (v.image) return [{ image: v.image, quantity: Number(v.quantity) || 1 }]
    if (v.images?.length) return v.images.map((img) => ({ image: img, quantity: Number(v.quantity) || 1 }))
    return []
  })
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
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
  })
  const [items, setItems] = useState<InventoryItem[]>(normalise(product?.color_variants))

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const totalStock = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    const newRows: InventoryItem[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) newRows.push({ image: json.url, quantity: 1 })
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

  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    const clean = items.filter((it) => it.image).map((it) => ({ image: it.image, quantity: Number(it.quantity) || 0 }))
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
          <h2 className="font-semibold text-gray-900">Inventory</h2>
          <span className="text-sm font-semibold text-[#C2185B]">Total stock: {totalStock}</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Click &ldquo;Add photos&rdquo; — each photo becomes a numbered row. Set how many pieces you have of each (e.g. 4 of one, 3 of another).</p>

        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                <span className="w-6 text-center text-sm font-bold text-gray-500 flex-shrink-0">{i + 1}</span>
                <div className="relative w-14 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                  <Image src={it.image} alt={`Item ${i + 1}`} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <label className="text-xs text-gray-500">Pieces</label>
                  <input
                    type="number"
                    min={0}
                    value={it.quantity}
                    onChange={(e) => setQty(i, Number(e.target.value))}
                    className="w-20 h-9 px-2 text-center rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                  />
                </div>
                <button type="button" onClick={() => removeRow(i)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
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
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Visibility</h2>
        {[
          { key: 'is_new_arrival', label: 'Mark as New Arrival' },
          { key: 'is_featured', label: 'Mark as Featured' },
        ].map((f) => (
          <label key={f.key} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form[f.key as keyof typeof form] as boolean} onChange={(e) => set(f.key, e.target.checked)} className="h-5 w-5 accent-[#C2185B]" />
            <span className="text-sm text-gray-700">{f.label}</span>
          </label>
        ))}
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
