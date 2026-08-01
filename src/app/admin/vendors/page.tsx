'use client'

import { useEffect, useState } from 'react'
import { Vendor } from '@/types'
import { Loader2, Plus, Trash2, X, Store, Power, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'
const EMPTY = { vendor_name: '', notes: '', status: 'active' as 'active' | 'inactive' }

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/admin/vendors').then((r) => r.json()).then(({ vendors }) => { setVendors(vendors || []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ vendor_name: v.vendor_name, notes: v.notes || '', status: v.status }); setShowForm(true) }

  const toggle = async (v: Vendor) => {
    const next = v.status === 'active' ? 'inactive' : 'active'
    setVendors((p) => p.map((x) => (x.id === v.id ? { ...x, status: next } : x)))
    const res = await fetch(`/api/admin/vendors/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (!res.ok) { toast.error('Update failed'); load() } else toast.success(next === 'active' ? 'Vendor activated' : 'Vendor deactivated')
  }

  const del = async (v: Vendor) => {
    if (!confirm(`Delete vendor "${v.vendor_name}"? Products keep their procurement details but lose the vendor link.`)) return
    setVendors((p) => p.filter((x) => x.id !== v.id))
    const res = await fetch(`/api/admin/vendors/${v.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); load() } else toast.success('Vendor deleted')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_name.trim()) { toast.error('Vendor name is required'); return }
    setSaving(true)
    const res = editing
      ? await fetch(`/api/admin/vendors/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/admin/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success(editing ? 'Vendor updated' : 'Vendor created'); setShowForm(false); load() }
    else { const { error } = await res.json(); toast.error(error || 'Failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Vendors</h1>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Vendor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No vendors yet. Add your first supplier to link products to them.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Vendor Name</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className={`border-b border-gray-50 last:border-b-0 ${v.status === 'inactive' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-[#4E1E24]">{v.vendor_name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="line-clamp-2 whitespace-pre-line">{v.notes || <span className="text-gray-300">—</span>}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${v.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {v.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(v)} title="Edit" className="p-1.5 text-gray-400 hover:text-[#AD1457] hover:bg-rose-50 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => toggle(v)} title={v.status === 'active' ? 'Deactivate' : 'Activate'} className={`p-1.5 rounded-lg transition-colors ${v.status === 'active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}><Power className="h-4 w-4" /></button>
                      <button onClick={() => del(v)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#4E1E24]">{editing ? 'Edit Vendor' : 'New Vendor'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400">Vendor Name *</label>
                <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="e.g. Sri Lakshmi Handlooms" className={input} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400">Vendor Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  placeholder={'e.g. Direct weaver from Mangalagiri.\nPreferred supplier for cotton sarees.'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">These notes auto-fill the product&apos;s Procurement Notes when this vendor is selected.</p>
              </div>
              <div>
                <label className="text-[11px] text-gray-400">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })} className={input}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update Vendor' : 'Create Vendor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
