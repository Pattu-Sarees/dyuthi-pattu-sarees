'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Star, BadgeCheck, X } from 'lucide-react'
import type { Testimonial } from '@/types'

const DURATION = 4500 // ms per slide

function initialOf(t: Testimonial) {
  return (t.avatar_initial?.trim() || t.customer_name.trim().charAt(0) || '★').toUpperCase()
}

function Card({ t, depth, onOpenProof }: { t: Testimonial; depth: 0 | 1 | 2; onOpenProof: (url: string) => void }) {
  // depth 0 = active (front, in normal flow — defines the section height);
  // 1 & 2 fan out zig-zag (one left, one right) absolutely behind it.
  const isActive = depth === 0
  const wrap = isActive ? 'relative' : 'absolute inset-0'
  const style: React.CSSProperties =
    isActive
      ? { transform: 'translate(0,0) scale(1) rotate(0deg)', zIndex: 30 }
      : depth === 1
      ? { transform: 'translate(-7%, 3%) scale(0.94) rotate(-4deg)', zIndex: 20 }
      : { transform: 'translate(7%, -4%) scale(0.92) rotate(4deg)', zIndex: 10 }

  return (
    <div className={`${wrap} transition-all duration-500 ease-out`} style={style} aria-hidden={!isActive}>
      <div className={`${isActive ? '' : 'h-full overflow-hidden'} flex flex-col rounded-2xl bg-white border border-[#EFE6D4] p-5 sm:p-6 ${isActive ? 'shadow-[0_18px_46px_-18px_rgba(78,30,36,0.4)]' : 'shadow-[0_10px_30px_-16px_rgba(78,30,36,0.3)]'}`}>
        {/* Top: avatar + name + verified */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-11 w-11 rounded-full bg-[#E7D3B8] text-[#7A2E39] flex items-center justify-center text-lg font-semibold"
            style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
            {initialOf(t)}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#3A2A26] leading-tight truncate">
              {t.customer_name}
              {t.location && <span className="font-normal text-xs text-[#A88C57]"> · {t.location}</span>}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A88C57]">
              <BadgeCheck className="h-3 w-3 text-[#B8860B]" />
              {t.is_verified_buyer ? 'Verified Buyer' : 'Customer Review'}
            </span>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />
            ))}
          </div>
        </div>

        {/* Review — full text, never truncated */}
        <blockquote className="mt-4 text-sm md:text-[15px] leading-relaxed text-[#5A4038]">
          {t.review_title && <span className="block font-semibold text-[#3A2A26] mb-0.5">{t.review_title}</span>}
          “{t.review_text}”
        </blockquote>

        {/* Source + date */}
        <p className="mt-2 text-[10px] tracking-wide text-[#A88C57]">
          {t.review_source && <span>via {t.review_source}</span>}
          {t.created_at && (
            <span>{t.review_source ? ' · ' : ''}{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          )}
        </p>

        {/* Bottom box: saree type on the left, review photo/screenshot on the right */}
        {(() => {
          const photo = t.review_images?.[0] || t.proof_image
          if (!t.purchased_product && !photo) return null
          return (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F3E9D7] p-2.5">
              {t.purchased_product && (
                <div className="flex-1 min-w-0 px-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#A88C57]">Purchased</p>
                  <p className="text-[13px] font-semibold text-[#5A4038] leading-snug">{t.purchased_product}</p>
                </div>
              )}
              {photo && (
                <button
                  type="button"
                  onClick={() => isActive && onOpenProof(photo)}
                  className="flex-shrink-0 ml-auto rounded-lg overflow-hidden border border-[#E4D6BC] bg-white shadow-sm cursor-zoom-in group/proof"
                  aria-label="View review photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Customer review photo" loading="lazy" className="h-16 w-16 object-cover transition-transform duration-300 group-hover/proof:scale-105" />
                </button>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const n = items.length

  useEffect(() => {
    if (paused || n <= 1) return
    const t = setTimeout(() => setI((p) => (p + 1) % n), DURATION)
    return () => clearTimeout(t)
  }, [i, paused, n])

  // Scrollbar seek (click + drag)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !barRef.current || n === 0) return
      const r = barRef.current.getBoundingClientRect()
      const f = Math.min(0.9999, Math.max(0, (e.clientX - r.left) / r.width))
      setI(Math.floor(f * n))
    }
    const onUp = () => { draggingRef.current = false; setPaused(false) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [n])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox])

  if (n === 0) return null

  const startSeek = (e: React.PointerEvent) => {
    draggingRef.current = true
    setPaused(true)
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const f = Math.min(0.9999, Math.max(0, (e.clientX - r.left) / r.width))
    setI(Math.floor(f * n))
  }

  const active = items[i]
  const behind1 = n > 1 ? items[(i + 1) % n] : null
  const behind2 = n > 2 ? items[(i + 2) % n] : null

  return (
    <section className="bg-[#FFFDF7]">
      <div className="container mx-auto px-4 pt-1 pb-8 md:pt-2 md:pb-10">
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#FBF3E4] px-6 py-7 md:px-10 md:py-9">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* LEFT */}
            <div className="text-center lg:text-left">
              <h2 className="leading-tight text-4xl md:text-5xl font-semibold text-[#3A2A26]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
                Customer Diaries
              </h2>
              <p className="mt-5 text-[#6B5148] leading-relaxed max-w-sm mx-auto lg:mx-0">
                From first impressions to cherished occasions, hear the stories shared by our customers.
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex items-center justify-center bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-8 py-3 rounded-full shadow transition-colors"
              >
                Shop Now
              </Link>
            </div>

            {/* RIGHT — stacked cards + scrollbar */}
            <div>
              <div
                className="relative mx-auto max-w-sm"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => { if (!draggingRef.current) setPaused(false) }}
              >
                {behind2 && behind2 !== active && <Card key={`b2-${behind2.id}`} t={behind2} depth={2} onOpenProof={setLightbox} />}
                {behind1 && behind1 !== active && <Card key={`b1-${behind1.id}`} t={behind1} depth={1} onOpenProof={setLightbox} />}
                <Card key={`a-${active.id}`} t={active} depth={0} onOpenProof={setLightbox} />
              </div>

              {/* Scrollbar / progress */}
              {n > 1 && (
                <div className="mx-auto max-w-md mt-6 px-1">
                  <div
                    ref={barRef}
                    onPointerDown={startSeek}
                    className="relative h-1.5 rounded-full bg-[#D9C7A2]/60 cursor-pointer"
                    role="slider"
                    aria-valuemin={1}
                    aria-valuemax={n}
                    aria-valuenow={i + 1}
                    aria-label="Testimonials position"
                  >
                    <div
                      className="absolute top-0 h-1.5 rounded-full bg-[#4E1E24] transition-[left] duration-500 ease-out"
                      style={{ width: `${100 / n}%`, left: `${(i * 100) / n}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proof lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[70] bg-[#2A0E13]/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Review screenshot"
        >
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Customer review screenshot" className="max-h-[90vh] max-w-[92vw] md:max-w-3xl object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </section>
  )
}
