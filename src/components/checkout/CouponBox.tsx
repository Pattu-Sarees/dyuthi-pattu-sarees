'use client'

import { useEffect, useState } from 'react'
import { BadgePercent, X, CheckCircle2, Loader2, Tag } from 'lucide-react'

type Applied = { code: string; description: string | null; discount: number }
type Listed = { code: string; description: string | null; discount_type: 'percent' | 'flat'; discount_value: number; min_order_value: number }

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const headline = (c: Listed) => (c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `${inr(c.discount_value)} OFF`)

export default function CouponBox({
  subtotal,
  coupon,
  onApply,
  onRemove,
}: {
  subtotal: number
  coupon: Applied | null
  onApply: (c: Applied) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<Listed[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [input, setInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<Applied | null>(null)

  // Load the available offers when the panel opens (and no coupon is applied).
  useEffect(() => {
    if (!open || coupon) return
    setLoadingList(true)
    fetch('/api/coupons/list')
      .then((r) => r.json())
      .then(({ coupons }) => setList(coupons || []))
      .catch(() => setList([]))
      .finally(() => setLoadingList(false))
  }, [open, coupon])

  const apply = async (code: string) => {
    const c = code.trim()
    if (!c) return
    setApplying(true); setError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) { setError(data.message || 'Invalid coupon') }
      else {
        const applied: Applied = { code: data.code, description: data.description ?? null, discount: data.discount }
        onApply(applied)
        setSuccess(applied)   // show the "Applied!" popup
        setInput('')
      }
    } catch {
      setError('Could not apply coupon. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const closeSuccess = () => { setSuccess(null); setOpen(false) }

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setError(''); setOpen(true) }}
        className="w-full flex items-center gap-2 rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 text-left hover:bg-green-50 transition-colors"
      >
        <BadgePercent className="h-5 w-5 text-green-600 flex-shrink-0" />
        <span className="font-semibold text-green-700">Apply Coupon</span>
      </button>

      {/* Applied chip */}
      {coupon && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
          <span className="inline-flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700 truncate">{coupon.code} applied · −{inr(coupon.discount)}</span>
          </span>
          <button type="button" onClick={onRemove} className="text-sm font-semibold text-gray-600 hover:text-red-600 flex-shrink-0">Remove</button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-stretch justify-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl shadow-xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between bg-white px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Apply Coupon</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Manual entry */}
              <div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3">
                  <Tag className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <input
                    value={input}
                    onChange={(e) => { setInput(e.target.value.toUpperCase()); if (error) setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(input) } }}
                    placeholder="Enter Discount Code"
                    className="flex-1 h-11 bg-transparent text-sm uppercase tracking-wide focus:outline-none"
                  />
                  <button type="button" onClick={() => apply(input)} disabled={applying || !input.trim()} className="text-sm font-bold text-[#C2185B] disabled:opacity-40 flex-shrink-0">
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
              </div>

              {/* Available offers — only when no coupon is applied (one per order) */}
              {coupon ? (
                <p className="text-xs text-gray-400">A coupon is already applied. Remove it to use a different one.</p>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Offers</p>
                  {loadingList ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
                  ) : list.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No offers available right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {list.map((c) => (
                        <div key={c.code} className="rounded-xl border border-dashed border-gray-300 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 tracking-wide">{c.code}</p>
                              <p className="text-xs font-semibold text-green-700">{headline(c)}{c.min_order_value > 0 ? ` · min ${inr(c.min_order_value)}` : ''}</p>
                            </div>
                            <button type="button" onClick={() => apply(c.code)} disabled={applying} className="text-sm font-bold text-[#C2185B] hover:text-[#a01049] disabled:opacity-40 flex-shrink-0">APPLY</button>
                          </div>
                          {c.description && <p className="mt-1 text-xs text-gray-500">{c.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success popup */}
      {success && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeSuccess} />
          <div className="relative w-full max-w-xs rounded-2xl bg-white shadow-xl px-6 py-6 text-center">
            <button type="button" onClick={closeSuccess} aria-label="Close" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{success.code} Applied!</p>
            {success.description && <p className="mt-1 text-sm text-gray-600">{success.description}</p>}
            <p className="mt-1 text-sm font-bold text-green-700">You saved {inr(success.discount)}</p>
            <button type="button" onClick={closeSuccess} className="mt-5 w-full h-11 rounded-lg bg-[#C2185B] text-white font-semibold hover:bg-[#a01049]">Yay!</button>
          </div>
        </div>
      )}
    </div>
  )
}
