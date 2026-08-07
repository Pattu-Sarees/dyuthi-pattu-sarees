'use client'

import { useEffect, useState } from 'react'
import { Coupon, DISCOUNT_TYPES } from '@/types'
import NavigationGuard from '@/components/NavigationGuard'
import { Loader2, Plus, Trash2, X, Ticket, Power, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useHighlight, HIGHLIGHT_RING } from '@/lib/use-highlight'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'
const EMPTY = { code: '', description: '', discount_type: 'percent', discount_value: '', min_order_value: '', max_order_value: '', expiry_date: '', usage_limit: '', max_daily_uses: '', per_user_limit: '', once_per_user: false, new_users_only: false, existing_users_only: false, allow_guests: true, is_active: true }

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const highlight = useHighlight('/admin/coupons')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const openNew = () => { setEditingId(null); setForm(EMPTY); setShowAdd(true) }
  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      description: c.description ?? '',
      discount_type: c.discount_type,
      discount_value: c.discount_value != null ? String(c.discount_value) : '',
      min_order_value: c.min_order_value ? String(c.min_order_value) : '',
      max_order_value: c.max_order_value != null ? String(c.max_order_value) : '',
      expiry_date: c.expiry_date ? String(c.expiry_date).slice(0, 10) : '',
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : '',
      max_daily_uses: c.max_daily_uses != null ? String(c.max_daily_uses) : '',
      per_user_limit: c.per_user_limit != null ? String(c.per_user_limit) : '',
      once_per_user: !!c.once_per_user,
      new_users_only: !!c.new_users_only,
      existing_users_only: !!c.existing_users_only,
      allow_guests: c.allow_guests !== false,
      is_active: c.is_active,
    })
    setShowAdd(true)
  }
  const closeModal = () => { setShowAdd(false); setEditingId(null); setForm(EMPTY) }

  const load = () => {
    fetch('/api/admin/coupons').then((r) => r.json()).then(({ coupons }) => { setCoupons(coupons || []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const isExpired = (c: Coupon) => !!c.expiry_date && new Date(c.expiry_date) < new Date(new Date().toDateString())

  const toggle = async (c: Coupon) => {
    setCoupons((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !c.is_active }) })
    if (!res.ok) { toast.error('Update failed'); load() } else toast.success(c.is_active ? 'Coupon disabled' : 'Coupon enabled')
  }

  const del = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return
    setCoupons((p) => p.filter((x) => x.id !== c.id))
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); load() } else toast.success('Coupon deleted')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('Code is required'); return }
    setSaving(true)
    const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success(editingId ? 'Coupon updated' : 'Coupon created'); closeModal(); load() }
    else { const { error } = await res.json(); toast.error(error || 'Failed') }
  }

  return (
    <div>
      {/* Confirm before leaving while adding a coupon. */}
      <NavigationGuard enabled={showAdd} />
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Coupons</h1>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-xs px-2.5 py-1.5 sm:text-sm sm:px-3.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No coupons yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = isExpired(c)
            const limitReached = c.usage_limit != null && c.used_count >= c.usage_limit
            return (
              <div key={c.id} data-hl={c.id} className={`bg-white rounded-xl border p-4 ${c.is_active && !expired ? 'border-gray-100' : 'border-gray-100 opacity-70'} ${highlight === c.id ? HIGHLIGHT_RING : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#4E1E24] tracking-wide">{c.code}</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${inr(c.discount_value)} off`}
                      {(c.min_order_value > 0 || c.max_order_value != null) && (
                        <span className="text-gray-400"> · {
                          c.min_order_value > 0 && c.max_order_value != null ? `${inr(c.min_order_value)}–${inr(c.max_order_value)}`
                          : c.max_order_value != null ? `up to ${inr(c.max_order_value)}`
                          : `min ${inr(c.min_order_value)}`
                        }</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} title="Edit" className="p-1.5 text-gray-400 hover:text-[#AD1457] hover:bg-rose-50 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => toggle(c)} title={c.is_active ? 'Disable' : 'Enable'} className={`p-1.5 rounded-lg transition-colors ${c.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}><Power className="h-4 w-4" /></button>
                    <button onClick={() => del(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
                  {!c.is_active && <Tag color="gray">Disabled</Tag>}
                  {expired && <Tag color="red">Expired</Tag>}
                  {limitReached && <Tag color="amber">Limit reached</Tag>}
                  {c.expiry_date && !expired && <Tag color="gray">Exp {new Date(c.expiry_date).toLocaleDateString('en-IN')}</Tag>}
                  <Tag color="rose">{c.used_count}{c.usage_limit != null ? `/${c.usage_limit}` : ''} used</Tag>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#4E1E24]">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CODE e.g. DIWALI10 *" className={input} />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={160} placeholder="Description (shown to customers, e.g. ₹100 off orders above ₹999)" className={input} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className={input}>
                  {DISCOUNT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t === 'percent' ? 'Percent (%)' : 'Flat (₹)'}</option>)}
                </select>
                <input type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="Discount value" className={input} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400">Order value range (₹) — leave blank for no limit</label>
                <div className="grid grid-cols-2 gap-3 mt-0.5">
                  <input type="number" min={0} value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} placeholder="Min order value" className={input} />
                  <input type="number" min={0} value={form.max_order_value} onChange={(e) => setForm({ ...form, max_order_value: e.target.value })} placeholder="Max order value" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400">Expiry date</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400">Total uses (all customers)</label>
                  <input type="number" min={1} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400">Max uses per day</label>
                  <input type="number" min={1} value={form.max_daily_uses} onChange={(e) => setForm({ ...form, max_daily_uses: e.target.value })} placeholder="Unlimited" className={input} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400">Uses per customer</label>
                  <input type="number" min={1} value={form.per_user_limit} onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })} placeholder="Unlimited" className={input} />
                </div>
              </div>

              {/* User restrictions */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Customer eligibility</p>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.once_per_user} onChange={(e) => setForm({ ...form, once_per_user: e.target.checked })} className="h-4 w-4 accent-[#AD1457]" />
                  Once per customer
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.new_users_only} onChange={(e) => setForm({ ...form, new_users_only: e.target.checked, existing_users_only: e.target.checked ? false : form.existing_users_only })} className="h-4 w-4 accent-[#AD1457]" />
                  New customers only (no previous paid order)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.existing_users_only} onChange={(e) => setForm({ ...form, existing_users_only: e.target.checked, new_users_only: e.target.checked ? false : form.new_users_only })} className="h-4 w-4 accent-[#AD1457]" />
                  Returning customers only (≥1 paid order)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.allow_guests} onChange={(e) => setForm({ ...form, allow_guests: e.target.checked })} className="h-4 w-4 accent-[#AD1457]" />
                  Allow guests (not signed in)
                </label>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Save Changes' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ color, children }: { color: 'gray' | 'red' | 'amber' | 'rose'; children: React.ReactNode }) {
  const map = {
    gray: 'bg-gray-100 text-gray-500',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-[#AD1457]',
  }
  return <span className={`px-2 py-0.5 rounded-full ${map[color]}`}>{children}</span>
}
