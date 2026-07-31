'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// One announcement shown at a time; auto-advances with a left-to-right slide-in.
const SLIDES = [
  { text: 'Welcome to our store', symbol: '🙏' },
  { text: 'Discover Our Timeless Handloom Collections', symbol: '✨' },
  { text: 'Free shipping across India', symbol: '🚚' },
  { text: 'International Shipping Available', symbol: '✈️' },
]

const INTERVAL = 2000 // auto-advance (message stays 2s)

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL)
    return () => clearInterval(id)
  }, [])

  const slide = SLIDES[index]

  return (
    <div className="bg-[#B8860B] text-[#FFF8E7] text-xs md:text-base py-0.5 md:py-1 px-2 md:px-4 overflow-hidden">
      <div className="relative max-w-3xl mx-auto flex items-center justify-center h-5 md:h-6">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous announcement"
          className="absolute left-0 p-1 rounded-full hover:bg-white/15 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <span
          key={index}
          className="animate-announce-slide flex items-center gap-1.5 md:gap-2 font-medium tracking-wide text-center whitespace-nowrap px-6 md:px-8"
        >
          {slide.text} <span aria-hidden>{slide.symbol}</span>
        </span>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next announcement"
          className="absolute right-0 p-1 rounded-full hover:bg-white/15 transition-colors"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  )
}
