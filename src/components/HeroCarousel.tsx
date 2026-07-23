'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { HERO_DEFAULT_SLIDES, type HeroSlide } from '@/lib/hero'

const DURATION = 4000 // ms per slide

export default function HeroCarousel({ slides = HERO_DEFAULT_SLIDES }: { slides?: HeroSlide[] }) {
  const items = slides.length ? slides : HERO_DEFAULT_SLIDES
  const N = items.length
  const [i, setI] = useState(0)
  const [hover, setHover] = useState(false)   // pause on hover (desktop)
  const [hidden, setHidden] = useState(false) // pause when tab inactive
  const touchX = useRef<number | null>(null)

  const paused = hover || hidden

  // Pause the autoplay when the browser tab is not visible.
  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Autoplay: advance every DURATION unless paused. Resets on any slide change.
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setI((p) => (p + 1) % N), DURATION)
    return () => clearTimeout(t)
  }, [i, paused])

  const next = () => setI((p) => (p + 1) % N)          // infinite loop
  const prev = () => setI((p) => (p - 1 + N) % N)

  // Swipe (mobile)
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)()
    touchX.current = null
  }

  return (
    <section
      className="relative bg-[#4A1F1F] overflow-hidden h-[380px] sm:h-[440px] md:h-[520px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Cross-fading slides */}
      {items.map((slide, idx) => (
        <div key={`${slide.image}-${idx}`} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === i ? 'opacity-100' : 'opacity-0'}`}>
          <Image src={slide.image} alt={slide.heading || 'Handloom sarees'} fill priority={idx === 0} className="object-cover" sizes="100vw" />
        </div>
      ))}

      {/* Dark scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

      {/* Overlay text */}
      <div className="container mx-auto px-4 relative h-full flex items-center">
        <div className="max-w-lg flex flex-col justify-center">
          <p className="font-medium tracking-widest uppercase text-xs mb-2 text-[#D9B36C]">A Legacy Woven in Silk</p>
          {(items[i]?.heading ?? '') && (
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-snug text-[#F8E7C5]">{items[i].heading}</h1>
          )}
          {(items[i]?.description ?? '') && (
            <p className="text-sm md:text-[15px] mb-6 leading-relaxed text-[#E8DCC7]">
              {items[i].description}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/products">
              <span className="inline-flex items-center gap-2 bg-[#B8860B] hover:bg-[#9c7209] text-white font-semibold px-5 py-2.5 rounded-md transition-colors uppercase text-xs tracking-wide">
                Shop Premium Sarees <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/about">
              <span className="inline-flex items-center gap-2 bg-transparent border border-[#B8860B] text-[#F8E7C5] hover:bg-[#B8860B]/10 font-semibold px-5 py-2.5 rounded-md transition-colors uppercase text-xs tracking-wide">
                Explore Heritage
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next buttons */}
      <button onClick={prev} aria-label="Previous slide" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} aria-label="Next slide" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-[#D9B36C]' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
        ))}
      </div>
    </section>
  )
}
