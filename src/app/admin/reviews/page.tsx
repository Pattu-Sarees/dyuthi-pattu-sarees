'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Loader2, Plus, X, Check, Trash2, Star, Pencil, Eye, EyeOff,
  BadgeCheck, Sparkles, ImagePlus, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { MANUAL_REVIEW_SOURCES, type Testimonial, type ReviewSource, type ReviewStatus } from '@/types'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

type Form = {
  id?: string
  customer_name: string
  location: string
  review_title: string
  review_text: string
  rating: number
  purchased_product: string
  review_source: ReviewSource
  proof_image: string
  is_verified_buyer: boolean
  is_featured: boolean
}

const empty: Form = {
  customer_name: '', location: '', review_title: '', review_text: '', rating: 5,
  purchased_product: '', review_source: 'WhatsApp', proof_image: '',
  is_verified_buyer: false, is_featured: false,
}

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
}

export default function AdminReviews() {
  const [rows, setRows] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Form>({ ...empty })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    fetch('/api/admin/testimonials')
      .then((r) => r.json())
      .then(({ testimonials }) => { setRows(testimonials || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows])

  const shown = useMemo(() => {
    const list = tab === 'all' ? rows : rows.filter((r) => r.status === tab)
    // Pending first in "All", then featured, then newest
    return [...list].sort((a, b) => {
      if (tab === 'all' && (a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
      return (b.created_at || '').localeCompare(a.created_at || '')
    })
  }, [rows, tab])

  const patchRow = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      const { testimonial } = await res.json()
      setRows((r) => r.map((x) => (x.id === id ? { ...x, ...testimonial } : x)))
      toast.success(okMsg)
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Update failed' }))
      toast.error(error || 'Update failed')
    }
  }

  const remove = async (t: Testimonial) => {
    if (!confirm(`Delete review by "${t.customer_name}"?`)) return
    const res = await fetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); setRows((r) => r.filter((x) => x.id !== t.id)) }
    else toast.error('Failed to delete')
  }

  const edit = (t: Testimonial) => {
    setForm({
      id: t.id,
      customer_name: t.customer_name,
      location: t.location || '',
      review_title: t.review_title || '',
      review_text: t.review_text,
      rating: t.rating,
      purchased_product: t.purchased_product || '',
      review_source: t.review_source,
      proof_image: t.proof_image || '',
      is_verified_buyer: t.is_verified_buyer,
      is_featured: t.is_featured,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const set = (k: keyof Form, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.customer_name.trim() || !form.review_text.trim()) { toast.error('Name and review are required'); return }
    setSaving(true)
    const url = form.id ? `/api/admin/testimonials/${form.id}` : '/api/admin/testimonials'
    const res = await fetch(url, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(form.id ? 'Review updated' : 'Review added (approved)')
      setForm({ ...empty }); setShowForm(false); load()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to save' }))
      toast.error(error || 'Failed to save')
    }
  }

  const uploadProof = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (json.url) set('proof_image', json.url)
    else toast.error(json.error || 'Upload failed')
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All Reviews' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <button
          onClick={() => { setForm({ ...empty }); setShowForm((v) => !v) }}
          className="inline-flex items-center gap-1.5 bg-[#C2185B] hover:bg-[#a01049] text-white text-sm font-semibold px-3.5 py-2 rounded-lg"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? 'Close' : 'Add review'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Customer submissions need approval before appearing on the website. Manual entries are approved automatically.
      </p>

      {/* Manual entry / edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">{form.id ? 'Edit review' : 'Add review manually'}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Customer name *</label>
              <input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} className={input} placeholder="e.g. Lakshmi Priya" />
            </div>
            <div>
              <label className={labelCls}>Location <span className="text-gray-400">(optional)</span></label>
              <input value={form.location} onChange={(e) => set('location', e.target.value)} className={input} placeholder="e.g. Ongole" />
            </div>
            <div>
              <label className={labelCls}>Rating</label>
              <select value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} className={input}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Review source</label>
              <select value={form.review_source} onChange={(e) => set('review_source', e.target.value as ReviewSource)} className={input}>
                {MANUAL_REVIEW_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Review title <span className="text-gray-400">(optional)</span></label>
              <input value={form.review_title} onChange={(e) => set('review_title', e.target.value)} className={input} placeholder="e.g. Gorgeous Kanchipattu" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Review text *</label>
              <textarea value={form.review_text} onChange={(e) => set('review_text', e.target.value)} rows={3} className={`${input} h-auto py-2 resize-y`} placeholder="What did they love about the saree?" />
            </div>
            <div>
              <label className={labelCls}>Purchased saree</label>
              <input value={form.purchased_product} onChange={(e) => set('purchased_product', e.target.value)} className={input} placeholder="e.g. Soft Touch Kanchipattu" />
            </div>
            <div>
              <label className={labelCls}>Screenshot / photo <span className="text-gray-400">(optional)</span></label>
              {form.proof_image ? (
                <div className="flex items-center gap-3">
                  <Image src={form.proof_image} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-medium text-[#C2185B] hover:underline">Replace</button>
                  <button type="button" onClick={() => set('proof_image', '')} className="text-xs font-medium text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 h-10 px-3 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#C2185B] hover:text-[#C2185B] text-sm w-full">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadProof(e.target.files?.[0])} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_verified_buyer} onChange={(e) => set('is_verified_buyer', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
              <span className="text-sm text-gray-700">Verified Buyer <span className="text-gray-400">(else “Previous Customer”)</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
              <span className="text-sm text-gray-700">Featured <span className="text-gray-400">(shown first)</span></span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setForm({ ...empty }); setShowForm(false) }} className="px-4 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving || uploading} className="flex-1 h-10 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {form.id ? 'Update' : 'Add (approved)'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#4E1E24] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label} <span className="opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#C2185B]" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-500">No reviews here.</div>
      ) : (
        <div className="space-y-3">
          {shown.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#4E1E24] text-[#F4E5C2] flex items-center justify-center font-semibold">
                  {(t.avatar_initial || t.customer_name.charAt(0)).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{t.customer_name}</p>
                    {t.location && <span className="text-xs text-gray-400">· {t.location}</span>}
                    <span className="flex">{Array.from({ length: t.rating }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />)}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t.review_source}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                    {t.is_verified_buyer && <span className="text-[10px] inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded"><BadgeCheck className="h-3 w-3" /> Verified</span>}
                    {t.is_featured && <span className="text-[10px] inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded"><Sparkles className="h-3 w-3" /> Featured</span>}
                  </div>
                  {t.review_title && <p className="text-sm font-semibold text-gray-800 mt-1">{t.review_title}</p>}
                  <p className={`text-sm text-gray-600 mt-0.5 ${expanded === t.id ? '' : 'line-clamp-2'}`}>{t.review_text}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    {t.purchased_product && <span className="text-[#7A2E39]">Purchased: {t.purchased_product}</span>}
                    {t.created_at && <span>{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                  {expanded === t.id && (t.review_images?.length || t.proof_image) && (
                    <div className="flex gap-2 mt-2">
                      {[...(t.review_images || []), ...(t.proof_image ? [t.proof_image] : [])].map((img) => (
                        <a key={img} href={img} target="_blank" rel="noopener noreferrer" className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 block">
                          <Image src={img} alt="Review" fill className="object-cover" sizes="64px" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {t.status !== 'approved' && (
                    <button onClick={() => patchRow(t.id, { status: 'approved' }, 'Approved — now live')} title="Approve" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><ThumbsUp className="h-4 w-4" /></button>
                  )}
                  {t.status !== 'rejected' && (
                    <button onClick={() => patchRow(t.id, { status: 'rejected' }, 'Rejected')} title="Reject" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><ThumbsDown className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => patchRow(t.id, { is_featured: !t.is_featured }, t.is_featured ? 'Unfeatured' : 'Featured — shown first')} title={t.is_featured ? 'Unfeature' : 'Feature'} className={`p-1.5 rounded-lg ${t.is_featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}><Sparkles className="h-4 w-4" /></button>
                  <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} title="View" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">{expanded === t.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button onClick={() => edit(t)} title="Edit" className="p-1.5 rounded-lg text-[#C2185B] hover:bg-rose-50"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(t)} title="Delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
