'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { StoreSettings, DEFAULT_STORE_SETTINGS } from '@/types'
import { Loader2, Store, Boxes, LayoutTemplate, Save, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'
const label = 'block text-sm font-medium text-gray-700 mb-1.5'

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)
  const [saved, setSaved] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then(({ settings }) => {
      if (settings) { setForm(settings); setSaved(settings) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  // Warn on unsaved changes when leaving the tab.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setForm((f) => ({ ...f, [k]: v }))

  const uploadHero = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) { const { url } = await res.json(); set('hero_banner_image', url) }
    else toast.error('Upload failed')
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { const { settings } = await res.json(); setForm(settings); setSaved(settings); toast.success('Settings saved successfully') }
    else { const { error } = await res.json().catch(() => ({ error: 'Failed' })); toast.error(error || 'Failed to save') }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>

  return (
    <div className="max-w-2xl pb-24">
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Settings</h1>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
      </div>

      {/* Store Information */}
      <Section icon={Store} title="Store Information" subtitle="Used on the contact page, footer, invoices and customer messages.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className={label}>Store Name</label><input value={form.store_name} onChange={(e) => set('store_name', e.target.value)} className={input} /></div>
          <div><label className={label}>Support Mobile Number</label><input value={form.support_mobile} onChange={(e) => set('support_mobile', e.target.value)} className={input} placeholder="+91 98765 43210" /></div>
          <div><label className={label}>WhatsApp Number</label><input value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} className={input} placeholder="+91 98765 43210" /></div>
          <div className="sm:col-span-2"><label className={label}>Business Email</label><input type="email" value={form.business_email} onChange={(e) => set('business_email', e.target.value)} className={input} placeholder="store@example.com" /></div>
          <div className="sm:col-span-2"><label className={label}>Store Address</label><textarea value={form.store_address} onChange={(e) => set('store_address', e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]" /></div>
        </div>
      </Section>

      {/* Inventory Settings */}
      <Section icon={Boxes} title="Inventory Settings" subtitle="Controls Low/Out status on Products, Inventory and the dashboard low-stock alerts.">
        <div className="max-w-xs">
          <label className={label}>Low Stock Threshold</label>
          <input type="number" min={0} max={100} value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', Math.max(0, Number(e.target.value) || 0))} className={input} />
          <p className="text-xs text-gray-400 mt-1.5">0 = Out · 1–{form.low_stock_threshold || 3} = Low · above = In</p>
        </div>
      </Section>

      {/* Homepage Settings */}
      <Section icon={LayoutTemplate} title="Homepage Settings" subtitle="Controls the announcement bar, hero banner and homepage sections.">
        <div className="space-y-4">
          <div><label className={label}>Announcement Text</label><input value={form.announcement_text} onChange={(e) => set('announcement_text', e.target.value)} className={input} placeholder="✨ Free shipping across India ✨" /></div>
          <div>
            <label className={label}>Hero Banner Image</label>
            <div className="flex items-center gap-3">
              {form.hero_banner_image ? (
                <div className="relative h-20 w-36 rounded-lg overflow-hidden border border-gray-200 group">
                  <Image src={form.hero_banner_image} alt="Hero banner" fill className="object-cover" sizes="144px" />
                  <button onClick={() => set('hero_banner_image', '')} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : null}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-20 w-36 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#AD1457] hover:text-[#AD1457] transition-colors text-xs">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ImagePlus className="h-5 w-5" /> {form.hero_banner_image ? 'Replace' : 'Upload'}</>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadHero(e.target.files?.[0] || null)} />
            </div>
          </div>
          <Toggle checked={form.show_best_sellers} onChange={(v) => set('show_best_sellers', v)} label="Show Best Sellers section" />
          <Toggle checked={form.show_new_arrivals} onChange={(v) => set('show_new_arrivals', v)} label="Show New Arrivals section" />
        </div>
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-56 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-2xl flex items-center justify-end gap-3">
          {dirty && <span className="text-xs text-gray-400">You have unsaved changes</span>}
          <button onClick={save} disabled={saving || !dirty} className="inline-flex items-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, subtitle, children }: { icon: typeof Store; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="h-9 w-9 rounded-lg bg-rose-50 text-[#AD1457] flex items-center justify-center flex-shrink-0"><Icon className="h-4.5 w-4.5" /></span>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[#AD1457]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}
