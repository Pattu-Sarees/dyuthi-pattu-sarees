'use client'

import { useEffect, useState } from 'react'
import { Lead, LeadStatus, LEAD_STATUSES, LEAD_SOURCES } from '@/types'
import { Loader2, Plus, Trash2, Phone, Mail, X, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useHighlight, HIGHLIGHT_RING } from '@/lib/use-highlight'

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-blue-50 text-blue-600',
  contacted: 'bg-amber-50 text-amber-600',
  interested: 'bg-purple-50 text-purple-600',
  converted: 'bg-green-50 text-green-600',
  closed: 'bg-gray-100 text-gray-500',
}

const EMPTY = { name: '', phone: '', email: '', source: 'website', status: 'new', notes: '', follow_up_date: '' }

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | LeadStatus>('all')
  const highlight = useHighlight('/admin/leads')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/admin/leads').then((r) => r.json()).then(({ leads }) => { setLeads(leads || []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const counts = LEAD_STATUSES.reduce<Record<string, number>>((a, s) => { a[s] = leads.filter((l) => l.status === s).length; return a }, {})
  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  const updateLead = async (id: string, patch: Partial<Lead>) => {
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    const res = await fetch(`/api/admin/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!res.ok) { toast.error('Update failed'); load() } else { toast.success('Lead updated') }
  }

  const deleteLead = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"?`)) return
    setLeads((p) => p.filter((l) => l.id !== id))
    const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); load() } else toast.success('Lead deleted')
  }

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success('Lead added'); setShowAdd(false); setForm(EMPTY); load() }
    else { const { error } = await res.json(); toast.error(error || 'Failed') }
  }

  const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Leads</h1>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-xs px-2.5 py-1.5 sm:text-sm sm:px-3.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap gap-1.5 sm:gap-2 pb-1.5 sm:pb-0 mb-3 sm:mb-4">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All {leads.length}</Chip>
        {LEAD_STATUSES.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>{s} {counts[s] || 0}</Chip>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No leads here yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} data-hl={l.id} className={`bg-white rounded-xl border border-gray-100 p-3 sm:p-4 overflow-x-auto md:overflow-visible ${highlight === l.id ? HIGHLIGHT_RING : ''}`}>
              <div className="flex flex-nowrap md:block items-start gap-3 min-w-max md:min-w-0">
                <div className="flex items-start justify-between gap-3 flex-shrink-0 md:flex-shrink">
                  <div className="max-w-[240px] md:max-w-none md:min-w-0">
                    <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap md:flex-wrap">
                      <p className="font-semibold text-gray-900">{l.name}</p>
                      <span className="text-[10px] capitalize bg-rose-50 text-[#AD1457] px-2 py-0.5 rounded-full flex-shrink-0">{l.source}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-nowrap whitespace-nowrap md:flex-wrap">
                      {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-[#AD1457]"><Phone className="h-3 w-3" /> {l.phone}</a>}
                      {l.email && <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-[#AD1457]"><Mail className="h-3 w-3" /> {l.email}</a>}
                      <span>{new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    {l.message && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{l.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={l.status}
                      onChange={(e) => updateLead(l.id, { status: e.target.value as LeadStatus })}
                      className={`text-xs font-medium rounded-full px-2.5 py-1.5 border-0 cursor-pointer capitalize ${STATUS_STYLES[l.status]}`}
                    >
                      {LEAD_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                    <button onClick={() => deleteLead(l.id, l.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="flex md:grid md:grid-cols-2 gap-3 flex-shrink-0 md:mt-3 md:pt-3 md:border-t md:border-gray-50">
                  <div className="w-44 md:w-auto">
                    <label className="text-[11px] text-gray-400">Notes</label>
                    <input defaultValue={l.notes || ''} onBlur={(e) => e.target.value !== (l.notes || '') && updateLead(l.id, { notes: e.target.value })} placeholder="Add a note…" className={input} />
                  </div>
                  <div className="w-40 md:w-auto">
                    <label className="text-[11px] text-gray-400">Follow-up date</label>
                    <input type="date" defaultValue={l.follow_up_date || ''} onChange={(e) => updateLead(l.id, { follow_up_date: e.target.value })} className={input} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#4E1E24]">Add Lead</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addLead} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name *" className={input} />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={input} />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={input}>
                  {LEAD_SOURCES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input}>
                  {LEAD_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />
              <button type="submit" disabled={saving} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-[11px] sm:text-xs font-medium capitalize px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${active ? 'bg-[#AD1457] text-white border-[#AD1457]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#AD1457]'}`}>
      {children}
    </button>
  )
}
