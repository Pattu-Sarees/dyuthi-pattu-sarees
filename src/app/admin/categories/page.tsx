'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, ImagePlus, Trash2, Plus, X, Check } from 'lucide-react'

type Cat = { id: string; name: string; slug: string; image: string; sort_order: number }

const empty = { name: '', slug: '', image: '', sort_order: 0 }

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ id?: string } & typeof empty>({ ...empty })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then(({ categories }) => { setCats(categories || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(false)
    if (json.url) set('image', json.url)
    else toast.error(json.error || 'Upload failed')
    e.target.value = ''
  }

  const save = async () => {
    if (!form.name || !form.slug) { toast.error('Name and slug are required'); return }
    if (!form.image) { toast.error('Please upload an image'); return }
    setSaving(true)
    const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories'
    const res = await fetch(url, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(form.id ? 'Category updated' : 'Category added')
      setForm({ ...empty })
      load()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to save')
    }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from the carousel?`)) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); setCats((c) => c.filter((x) => x.id !== id)) }
    else toast.error('Failed to delete')
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Carousel Categories</h1>
      <p className="text-sm text-gray-500 mb-6">Manage the category circles shown on the homepage carousel</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">{form.id ? 'Edit category' : 'Add category'}</h2>
          <div className="space-y-3">
            <label className="relative block w-full aspect-square max-w-[160px] mx-auto rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#C2185B] flex items-center justify-center text-gray-400">
              {form.image ? (
                <Image src={form.image} alt="" fill className="object-cover" sizes="160px" />
              ) : uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <span className="flex flex-col items-center"><ImagePlus className="h-6 w-6" /><span className="text-[10px] mt-1">Add image</span></span>
              )}
              <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="e.g. Gadwal Sarees" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category slug <span className="text-gray-400">(matches product category)</span></label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={input} placeholder="e.g. gadwal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
              <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} className={input} />
            </div>
            <div className="flex gap-2 pt-1">
              {form.id && (
                <button onClick={() => setForm({ ...empty })} className="px-4 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-1"><X className="h-4 w-4" /> Cancel</button>
              )}
              <button onClick={save} disabled={saving || uploading} className="flex-1 h-10 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {form.id ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#C2185B]" /></div>
          ) : cats.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-500">No categories yet. Add your first one.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cats.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                  <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 ring-2 ring-[#D4AF37]">
                    {c.image ? <Image src={c.image} alt={c.name} fill className="object-cover" sizes="80px" /> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-1">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.slug}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <button onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, image: c.image, sort_order: c.sort_order })} className="text-xs text-[#C2185B] hover:underline">Edit</button>
                    <button onClick={() => remove(c.id, c.name)} className="text-xs text-red-500 hover:underline inline-flex items-center gap-0.5"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
