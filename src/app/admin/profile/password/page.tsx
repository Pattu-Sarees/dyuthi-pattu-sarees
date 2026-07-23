'use client'

import { useState } from 'react'
import { Loader2, KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import { toast } from 'sonner'
import { isValidPassword, PASSWORD_RULES_MSG } from '@/lib/password'

const input = 'w-full h-11 pl-10 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]'

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <Check className={`h-3.5 w-3.5 ${ok ? '' : 'opacity-40'}`} /> {children}
    </li>
  )
}

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return toast.error('Enter your current password')
    if (!isValidPassword(next)) return toast.error(PASSWORD_RULES_MSG)
    if (next !== confirm) return toast.error('New passwords do not match')
    setSaving(true)
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Password Changed Successfully')
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed' }))
      toast.error(error || 'Failed to change password')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-5" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Change Password</h1>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <Field label="Current password" value={current} onChange={setCurrent} show={show} />
        <Field label="New password" value={next} onChange={setNext} show={show} />
        <Field label="Re-type new password" value={confirm} onChange={setConfirm} show={show} />

        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[#AD1457]" /> Show passwords
        </label>

        <ul className="text-xs space-y-1 bg-gray-50 rounded-lg p-3">
          <Rule ok={next.length >= 8 && next.length <= 20}>8–20 characters</Rule>
          <Rule ok={/[A-Z]/.test(next)}>One uppercase letter (A–Z)</Rule>
          <Rule ok={/[a-z]/.test(next)}>One lowercase letter (a–z)</Rule>
          <Rule ok={/[0-9]/.test(next)}>One number (0–9)</Rule>
          <Rule ok={/[!@#$%^&*()_+\-=\[\]{};:,.?]/.test(next)}>One special character (! @ # $ …)</Rule>
          <Rule ok={confirm.length > 0 && next === confirm}>Passwords match</Rule>
        </ul>

        <button type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, show }: { label: string; value: string; onChange: (v: string) => void; show: boolean }) {
  const [reveal, setReveal] = useState(false)
  const visible = show || reveal
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className={input} maxLength={40} />
        <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
