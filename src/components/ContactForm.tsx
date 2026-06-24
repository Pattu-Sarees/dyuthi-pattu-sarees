'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) { toast.error('Name and email are required'); return }
    setSending(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSending(false)
    if (res.ok) {
      toast.success('Thank you! We will get back to you soon.')
      setForm({ name: '', phone: '', email: '', message: '' })
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to send' }))
      toast.error(error || 'Failed to send')
    }
  }

  const input = 'w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required className={input} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={input} placeholder="Mobile number" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={input} placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
        <textarea value={form.message} onChange={(e) => set('message', e.target.value)} rows={5} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="How can we help?" />
      </div>
      <button type="submit" disabled={sending} className="w-full bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold py-3 rounded-md transition-colors uppercase tracking-wide text-sm disabled:opacity-50 flex items-center justify-center gap-2">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Message'}
      </button>
    </form>
  )
}
