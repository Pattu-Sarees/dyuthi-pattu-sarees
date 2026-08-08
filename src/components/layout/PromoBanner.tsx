'use client'

import { useEffect, useState } from 'react'
import { Tag, X, Copy, Check } from 'lucide-react'

type Offer = { code: string; description: string | null; discount_type: 'percent' | 'flat'; discount_value: number; min_order_value: number }

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const headline = (o: Offer) => (o.discount_type === 'percent' ? `${o.discount_value}% off` : `Save ${inr(o.discount_value)}`)

// Thin promotional bar shown below the header. Text is admin-editable; the
// "View Offers" button opens a drawer listing the store's live coupons with a
// one-tap copy. Hidden entirely when the admin disables the Offer Banner.
export default function PromoBanner({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Prefetch the offers once when the banner mounts, so the drawer opens
  // instantly (no "Loading…"). The banner lives in the persistent layout, so
  // this runs a single time per session, not on every navigation.
  useEffect(() => {
    fetch('/api/coupons/list')
      .then((r) => r.json())
      .then(({ coupons }) => setOffers(coupons || []))
      .catch(() => setOffers([]))
      .finally(() => setLoaded(true))
  }, [])

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
    }).catch(() => {})
  }

  return (
    <>
      {/* Thin bar — seamless right→left marquee; CTA pinned far right */}
      <div className="w-full bg-[#3a0d22] border-b border-[#E0B44C]/30">
        <div className="relative h-9 overflow-hidden">
          {/* Marquee track: two identical groups (each repeats the message enough
              to overfill the bar) → loops seamlessly at -50% with no empty gaps. */}
          <div className="promo-marquee flex h-full w-max items-center whitespace-nowrap will-change-transform">
            <div className="flex flex-shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={`a${i}`} className="px-8 text-[12px] sm:text-[13px] font-medium text-[#FFF7EA]">{text}</span>
              ))}
            </div>
            <div className="flex flex-shrink-0" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={`b${i}`} className="px-8 text-[12px] sm:text-[13px] font-medium text-[#FFF7EA]">{text}</span>
              ))}
            </div>
          </div>

          {/* Far-right CTA with a gradient mask so text fades under it */}
          <div className="absolute right-0 top-0 h-full flex items-center pr-4 pl-10 bg-gradient-to-l from-[#3a0d22] via-[#3a0d22] to-transparent">
            <button type="button" onClick={() => setOpen(true)} className="relative group font-semibold text-[#E0B44C] hover:text-[#efc86a] whitespace-nowrap text-[12px] sm:text-[13px]">
              View Offers <span aria-hidden>→</span>
              <span aria-hidden className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-0 bg-[#E0B44C] transition-all duration-300 ease-out group-hover:w-full" />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes promomarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .promo-marquee { animation: promomarquee 30s linear infinite; }
        .promo-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .promo-marquee { animation: none; } }
      `}</style>

      {/* Offers drawer */}
      {open && (
        <div className="fixed inset-0 z-[85] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-label="Exclusive Offers" className="relative w-full max-w-sm bg-[#FFFDF7] shadow-xl h-full overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between bg-[#FFFDF7] px-5 py-4 border-b border-[#efe3d0]">
              <h3 className="font-bold tracking-wide text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>EXCLUSIVE OFFERS</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5">
              {!loaded ? (
                <p className="text-sm text-gray-400 text-center py-10">Loading offers…</p>
              ) : offers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No offers available right now.</p>
              ) : (
                <ul className="space-y-4">
                  {offers.map((o, i) => (
                    <li key={o.code}>
                      {i > 0 && <div className="border-t border-dashed border-gray-200 mb-4" />}
                      <p className="text-sm font-semibold text-[#4E1E24]">{headline(o)}{o.min_order_value > 0 ? ` on orders above ${inr(o.min_order_value)}` : ''}</p>
                      {o.description && <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[#C2185B]/40 bg-rose-50 px-3 py-1.5 text-sm font-bold tracking-wide text-[#C2185B]">
                          <Tag className="h-3.5 w-3.5" /> {o.code}
                        </span>
                        <button type="button" onClick={() => copy(o.code)} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#C2185B]">
                          {copied === o.code ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-6 text-[11px] text-gray-400 text-center">Apply your code at checkout. One coupon per order.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
