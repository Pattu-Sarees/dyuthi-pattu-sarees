'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Product } from '@/types'
import { toast } from 'sonner'
import { Loader2, Upload, X, ImagePlus } from 'lucide-react'

const CATEGORIES = ['kanjivaram', 'banarasi', 'patola', 'chanderi', 'silk', 'cotton', 'linen', 'georgette', 'kalamkari', 'gadwal', 'mysore']
const FABRICS = ['pure silk', 'blended silk', 'pure cotton', 'handloom cotton', 'linen', 'georgette']

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
    color: product?.color?.join(', ') || '',
    occasion: product?.occasion?.join(', ') || '',
    stock_quantity: product?.stock_quantity?.toString() || '10',
    in_stock: product?.in_stock ?? true,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
  })
  const [images, setImages] = useState<string[]>(product?.images || [])

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
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
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    if (images.length === 0) { toast.error('Please upload at least one image'); return }
    setSaving(true)

    const payload = {
      ...form,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: Number(form.stock_quantity),
      color: form.color.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      occasion: form.occasion.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      images,
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
      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Saree Images</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url) => (
            <div key={url} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt="" fill className="object-cover" sizes="120px" />
              <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#C2185B] hover:bg-rose-50 transition-colors text-gray-400 hover:text-[#C2185B]">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-[10px] mt-1 text-center px-1">{uploading ? 'Uploading' : 'Add Photo'}</span>
            <input type="file" accept="image/*" multiple capture="environment" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">Tap to upload from gallery or camera. First image is the main photo.</p>
      </div>

      {/* Basic details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Product Details</h2>
        <div>
          <label className={label}>Saree Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="e.g. Kanjivaram Pure Silk Saree - Ruby Red" required />
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
            <input value={form.region} onChange={(e) => set('region', e.target.value)} className={input} placeholder="e.g. kanchipuram" />
          </div>
          <div>
            <label className={label}>Stock Quantity</label>
            <input type="number" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} className={input} placeholder="10" />
          </div>
        </div>
        <div>
          <label className={label}>Colors <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input value={form.color} onChange={(e) => set('color', e.target.value)} className={input} placeholder="red, gold" />
        </div>
        <div>
          <label className={label}>Occasions <span className="text-gray-400 font-normal">(comma separated)</span></label>
          <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={input} placeholder="wedding, festival" />
        </div>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Visibility</h2>
        {[
          { key: 'in_stock', label: 'In Stock' },
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
