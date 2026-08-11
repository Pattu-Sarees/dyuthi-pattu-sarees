'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { HomepageSection, HOMEPAGE_SECTION_LABELS, HomepageSectionKey } from '@/types'
import { Loader2, ChevronUp, ChevronDown, Power, ImagePlus, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { FOOTER_DEFAULTS, type FooterData } from '@/lib/footer'
import { type HeroSlide } from '@/lib/hero'
import { processAndUpload } from '@/lib/clientImageUpload'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/admin/homepage').then((r) => r.json()).then(({ sections }) => { setSections(sections || []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const patch = async (key: HomepageSectionKey, body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/homepage', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, ...body }) })
    if (!res.ok) { toast.error('Update failed'); load(); return false }
    return true
  }

  const toggle = async (s: HomepageSection) => {
    setSections((p) => p.map((x) => (x.key === s.key ? { ...x, enabled: !x.enabled } : x)))
    if (await patch(s.key, { enabled: !s.enabled })) toast.success(s.enabled ? 'Section hidden' : 'Section shown')
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    const reorder = next.map((s, i) => ({ key: s.key, sort_order: i }))
    setSections(next.map((s, i) => ({ ...s, sort_order: i })))
    const res = await fetch('/api/admin/homepage', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reorder }) })
    if (!res.ok) { toast.error('Reorder failed'); load() }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Homepage</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">Enable/disable sections, edit copy, upload images, and reorder. Changes apply to the storefront immediately.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <SectionCard
              key={s.key}
              section={s}
              index={i}
              total={sections.length}
              onToggle={() => toggle(s)}
              onMove={move}
              onSave={(body) => patch(s.key, body)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SectionCard({ section, index, total, onToggle, onMove, onSave }: {
  section: HomepageSection
  index: number
  total: number
  onToggle: () => void
  onMove: (i: number, dir: -1 | 1) => void
  onSave: (body: Record<string, unknown>) => Promise<boolean>
}) {
  const [title, setTitle] = useState(section.title || '')
  const [subtitle, setSubtitle] = useState(section.subtitle || '')
  const [message, setMessage] = useState((section.data?.message as string) || '')
  const [images, setImages] = useState<string[]>(section.images || [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isAnnouncement = section.key === 'announcement'
  const isPromo = section.key === 'promo'
  const isFooter = section.key === 'footer'
  const isHero = section.key === 'hero'

  // Hero stores an array of slides (image + heading + description) in `data.slides`.
  const heroFromSection = (): HeroSlide[] => {
    const raw = (section.data?.slides as unknown[]) || []
    return raw.map((s) => {
      const o = (s || {}) as Partial<HeroSlide>
      return {
        image: typeof o.image === 'string' ? o.image : '',
        heading: typeof o.heading === 'string' ? o.heading : '',
        description: typeof o.description === 'string' ? o.description : '',
      }
    })
  }
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(heroFromSection)
  const [heroUploading, setHeroUploading] = useState<number | null>(null)

  const setSlide = (idx: number, patch: Partial<HeroSlide>) =>
    setHeroSlides((s) => s.map((sl, i) => (i === idx ? { ...sl, ...patch } : sl)))
  const addSlide = () => setHeroSlides((s) => [...s, { image: '', heading: '', description: '' }])
  const removeSlide = (idx: number) => setHeroSlides((s) => s.filter((_, i) => i !== idx))
  const moveSlide = (idx: number, dir: -1 | 1) =>
    setHeroSlides((s) => {
      const t = idx + dir
      if (t < 0 || t >= s.length) return s
      const next = [...s]
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })
  const uploadSlideImage = async (idx: number, files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setHeroUploading(idx)
    try {
      const url = await processAndUpload(file, { folder: 'homepage' })
      setSlide(idx, { image: url })
    } catch (e) {
      toast.error((e as Error)?.message || 'Upload failed')
    }
    setHeroUploading(null)
  }

  // Footer stores its editable content in `data`. Start from saved values,
  // falling back to defaults so fields are pre-filled.
  const footerFromSection = (): FooterData => {
    const d = (section.data || {}) as Partial<Record<keyof FooterData, string>>
    const out = { ...FOOTER_DEFAULTS }
    ;(Object.keys(FOOTER_DEFAULTS) as (keyof FooterData)[]).forEach((k) => {
      if (typeof d[k] === 'string') out[k] = d[k] as string
    })
    return out
  }
  const [footer, setFooter] = useState<FooterData>(footerFromSection)
  const setF = (k: keyof FooterData, v: string) => setFooter((f) => ({ ...f, [k]: v }))

  const dirty = isFooter
    ? JSON.stringify(footer) !== JSON.stringify(footerFromSection())
    : isHero
    ? JSON.stringify(heroSlides) !== JSON.stringify(heroFromSection())
    : title !== (section.title || '') || subtitle !== (section.subtitle || '') ||
      message !== ((section.data?.message as string) || '') || JSON.stringify(images) !== JSON.stringify(section.images || [])

  const save = async () => {
    if (isHero && heroSlides.some((s) => !s.image)) { toast.error('Every hero slide needs an image'); return }
    setSaving(true)
    let body: Record<string, unknown>
    if (isFooter) {
      body = { data: { ...section.data, ...footer } }
    } else if (isHero) {
      body = { data: { ...section.data, slides: heroSlides } }
    } else {
      body = { title: title || null, subtitle: subtitle || null, images }
      if (isAnnouncement || isPromo) body.data = { ...section.data, message }
    }
    const ok = await onSave(body)
    setSaving(false)
    if (ok) toast.success('Saved')
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const next = [...images]
    for (const file of Array.from(files)) {
      try {
        next.push(await processAndUpload(file, { folder: 'homepage' }))
      } catch (e) {
        toast.error((e as Error)?.message || 'Upload failed')
      }
    }
    setImages(next)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${section.enabled ? '' : 'opacity-70'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col">
            <button onClick={() => onMove(index, -1)} disabled={index === 0} className="text-gray-300 hover:text-[#AD1457] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="text-gray-300 hover:text-[#AD1457] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{HOMEPAGE_SECTION_LABELS[section.key]}</p>
            <p className="text-[11px] text-gray-400">{section.enabled ? 'Visible on storefront' : 'Hidden'}</p>
          </div>
        </div>
        <button onClick={onToggle} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${section.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
          <Power className="h-4 w-4" /> {section.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="grid gap-3 mt-3 pt-3 border-t border-gray-50">
        {isFooter ? (
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">About / description</span>
              <textarea value={footer.description} onChange={(e) => setF('description', e.target.value)} rows={3} placeholder="Short description shown in the footer" className={`${input} h-auto py-2 resize-y`} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">Tagline</span>
              <input value={footer.tagline} onChange={(e) => setF('tagline', e.target.value)} placeholder="e.g. Proudly Made in India" className={input} />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Email</span>
                <input value={footer.email} onChange={(e) => setF('email', e.target.value)} placeholder="Email" className={input} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Phone(s)</span>
                <input value={footer.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="Phone number(s)" className={input} />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">Address</span>
              <textarea value={footer.address} onChange={(e) => setF('address', e.target.value)} rows={2} placeholder="Shop address" className={`${input} h-auto py-2 resize-y`} />
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Facebook URL</span>
                <input value={footer.facebook} onChange={(e) => setF('facebook', e.target.value)} placeholder="https://facebook.com/…" className={input} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Instagram URL</span>
                <input value={footer.instagram} onChange={(e) => setF('instagram', e.target.value)} placeholder="https://instagram.com/…" className={input} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">YouTube URL</span>
                <input value={footer.youtube} onChange={(e) => setF('youtube', e.target.value)} placeholder="https://youtube.com/…" className={input} />
              </label>
            </div>
            <p className="text-[11px] text-gray-400">Leave a social URL blank to keep that icon as a placeholder link.</p>
          </div>
        ) : isHero ? (
          <div className="grid gap-3">
            {heroSlides.map((slide, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 p-3 grid sm:grid-cols-[96px_1fr] gap-3">
                {/* Slide image */}
                <div>
                  <label className="relative block h-24 w-24 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#AD1457] flex items-center justify-center text-gray-400 bg-white">
                    {slide.image ? (
                      <Image src={slide.image} alt="" fill className="object-cover" sizes="96px" />
                    ) : heroUploading === idx ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                    <input type="file" accept="image/*" hidden onChange={(e) => uploadSlideImage(idx, e.target.files)} />
                  </label>
                </div>
                {/* Slide text + controls */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Slide {idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-[#AD1457] disabled:opacity-30 p-1"><ChevronUp className="h-4 w-4" /></button>
                      <button onClick={() => moveSlide(idx, 1)} disabled={idx === heroSlides.length - 1} className="text-gray-300 hover:text-[#AD1457] disabled:opacity-30 p-1"><ChevronDown className="h-4 w-4" /></button>
                      <button onClick={() => removeSlide(idx)} className="text-red-400 hover:text-red-600 p-1" aria-label="Remove slide"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <input value={slide.heading} onChange={(e) => setSlide(idx, { heading: e.target.value })} placeholder="Heading" className={input} />
                  <textarea value={slide.description} onChange={(e) => setSlide(idx, { description: e.target.value })} rows={2} placeholder="Description" className={`${input} h-auto py-2 resize-y`} />
                </div>
              </div>
            ))}
            <button onClick={addSlide} className="inline-flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#AD1457] hover:text-[#AD1457] rounded-lg py-2 text-sm font-medium transition-colors">
              <ImagePlus className="h-4 w-4" /> Add slide
            </button>
            {heroSlides.length === 0 && <p className="text-[11px] text-gray-400">No slides yet — add at least one. If left empty, the storefront shows the default hero.</p>}
          </div>
        ) : isAnnouncement ? (
          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-600">Announcement text</span>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Enjoy Free Shipping All Over India" className={input} />
          </label>
        ) : isPromo ? (
          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-600">Offer banner text</span>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="🧵 Direct From Weavers · 🚚 Free Shipping · 🎁 Festive Savings Up to ₹300" className={input} />
            <span className="text-[11px] text-gray-400">A “View Offers →” button (opening the coupon list) is added automatically. Toggle this section off to hide the banner when offers are closed.</span>
          </label>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={input} />
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className={input} />
          </div>
        )}

        {!isFooter && !isHero && !isAnnouncement && (
          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1">Images</span>
            <div className="flex flex-wrap gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 group">
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  <button onClick={() => setImages(images.filter((_, j) => j !== idx))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#AD1457] hover:text-[#AD1457] transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
