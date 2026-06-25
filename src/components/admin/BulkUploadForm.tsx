'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, Upload, X, ImagePlus } from 'lucide-react'

const CATEGORIES = ['mangalgiri', 'kuppadam', 'gadwal', 'kota', 'kanchipattu', 'soft silks', 'jamdhani', 'butter silk', 'green mango', 'lehengas', 'dress materials']
const FABRICS = ['pure silk', 'blended silk', 'cotton', 'soft silk', 'linen']

export default function BulkUploadForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const [form, setForm] = useState({
    baseName: '',
    price: '',
    original_price: '',
    category: 'kanjivaram',
    fabric: 'pure silk',
    region: '',
    occasion: '',
    stock_quantity: '1',
    is_new_arrival: true,
    is_featured: false,
  })
  const [images, setImages] = useState<string[]>([])

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setProgress({ done: 0, total: files.length })
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) setImages((prev) => [...prev, json.url])
        else toast.error(json.error || 'Upload failed')
      } catch {
        toast.error('Upload failed')
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.baseName.trim()) { toast.error('Enter a base name'); return }
    if (!form.price) { toast.error('Enter a price'); return }
    if (images.length === 0) { toast.error('Upload at least one photo'); return }

    setSaving(true)
    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseName: form.baseName,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        category: form.category,
        fabric: form.fabric,
        region: form.region,
        stock_quantity: Number(form.stock_quantity) || 1,
        occasion: form.occasion.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
        is_new_arrival: form.is_new_arrival,
        is_featured: form.is_featured,
        images,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const { created } = await res.json()
      toast.success(`${created} products created!`)
      router.push('/admin')
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to create products')
    }
  }

  const label = 'block text-sm font-medium text-gray-700 mb-1.5'
  const input = 'w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-900">
        Upload many saree photos at once. Each photo becomes its <strong>own product</strong> with the shared details below
        and the quantity you set (usually 1 for unique pieces).
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Saree Photos</h2>
          <span className="text-sm font-semibold text-[#C2185B]">{images.length} photo{images.length !== 1 ? 's' : ''} → {images.length} product{images.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Select all your saree photos in one go.</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url) => (
            <div key={url} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt="" fill className="object-cover" sizes="100px" />
              <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#C2185B] hover:bg-rose-50 transition-colors text-gray-400 hover:text-[#C2185B]">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[9px] mt-1 text-center px-1">{uploading ? `${progress.done}/${progress.total}` : 'Add photos'}</span>
            <input type="file" accept="image/*" multiple capture="environment" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Shared details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Shared Details (applied to all)</h2>
        <div>
          <label className={label}>Base Name *</label>
          <input value={form.baseName} onChange={(e) => set('baseName', e.target.value)} className={input} placeholder="e.g. Gadwal Silk Saree" required />
          <p className="text-xs text-gray-400 mt-1">Products will be named &ldquo;{form.baseName || 'Gadwal Silk Saree'} 1&rdquo;, &ldquo;{form.baseName || 'Gadwal Silk Saree'} 2&rdquo;, …</p>
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
            <input value={form.region} onChange={(e) => set('region', e.target.value)} className={input} placeholder="e.g. gadwal" />
          </div>
          <div>
            <label className={label}>Qty per saree</label>
            <input type="number" min={1} value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} className={input} placeholder="1" />
          </div>
        </div>
        <div>
          <label className={label}>Occasions <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={input} placeholder="wedding, festival" />
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => set('is_new_arrival', e.target.checked)} className="h-5 w-5 accent-[#C2185B]" />
            <span className="text-sm text-gray-700">Mark all as New Arrivals</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="h-5 w-5 accent-[#C2185B]" />
            <span className="text-sm text-gray-700">Mark all as Featured</span>
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-50 pt-3 -mx-4 px-4 pb-4 border-t border-gray-100">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button type="button" onClick={() => router.push('/admin')} className="px-5 h-12 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className="flex-1 h-12 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            Create {images.length > 0 ? images.length : ''} Products
          </button>
        </div>
      </div>
    </form>
  )
}
