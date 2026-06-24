'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Category = { name: string; slug: string; img: string }

const GOLD = '#D4AF37'

// All categories use the jeweled rectangle frame.
const FRAME_BY_SLUG: Record<string, string> = {}

const DOME_BB = 'M0.12,0.96 L0.12,0.45 Q0.12,0.08 0.5,0.08 Q0.88,0.08 0.88,0.45 L0.88,0.96 Q0.88,0.98 0.86,0.98 L0.14,0.98 Q0.12,0.98 0.12,0.96 Z'
const DOME = 'M12,96 L12,45 Q12,8 50,8 Q88,8 88,45 L88,96 Q88,98 86,98 L14,98 Q12,98 12,96 Z'
const TAG_BB = 'M0.1,0.08 Q0.1,0.04 0.14,0.04 L0.86,0.04 Q0.9,0.04 0.9,0.08 L0.9,0.58 Q0.9,0.72 0.74,0.72 Q0.63,0.72 0.6,0.84 Q0.57,0.93 0.5,0.93 Q0.43,0.93 0.4,0.84 Q0.37,0.72 0.26,0.72 Q0.1,0.72 0.1,0.58 Z'
const TAG = 'M10,8 Q10,4 14,4 L86,4 Q90,4 90,8 L90,58 Q90,72 74,72 Q63,72 60,84 Q57,93 50,93 Q43,93 40,84 Q37,72 26,72 Q10,72 10,58 Z'

const ring = (r: number, w: number, op = 1) => (
  <circle cx="50" cy="50" r={r} fill="none" stroke={GOLD} strokeWidth={w} opacity={op} />
)
const radial = (n: number, R: number, render: (cx: number, cy: number, deg: number) => React.ReactNode) =>
  Array.from({ length: n }).map((_, i) => {
    const deg = (i * 360) / n
    const t = (deg * Math.PI) / 180
    return <g key={i}>{render(50 + R * Math.sin(t), 50 - R * Math.cos(t), deg)}</g>
  })

function Img({ cat, className, style }: { cat: Category; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute overflow-hidden ${className || ''}`} style={style}>
      <Image src={cat.img} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="220px" />
    </div>
  )
}

function CategoryCard({ cat, idx }: { cat: Category; idx: number }) {
  const type = FRAME_BY_SLUG[cat.slug] || 'jewel'
  const uid = `frame${idx}`
  let image: React.ReactNode
  let frame: React.ReactNode

  if (type === 'jewel') {
    image = <Img cat={cat} className="rounded-lg" style={{ inset: '12%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <rect x="9" y="9" width="82" height="82" rx="6" fill="none" stroke={GOLD} strokeWidth="2.4" />
        <rect x="13" y="13" width="74" height="74" rx="4" fill="none" stroke={GOLD} strokeWidth="0.7" opacity="0.6" />
        {[20, 35, 50, 65, 80].map((x) => (
          <g key={x}>
            <path d="M0,-3.4 L3.4,0 L0,3.4 L-3.4,0 Z" fill={GOLD} transform={`translate(${x} 9)`} />
            <path d="M0,-3.4 L3.4,0 L0,3.4 L-3.4,0 Z" fill={GOLD} transform={`translate(${x} 91)`} />
          </g>
        ))}
      </svg>
    )
  } else if (type === 'bell') {
    image = <Img cat={cat} style={{ inset: 0, clipPath: `url(#${uid})` }} />
    frame = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs><clipPath id={uid} clipPathUnits="objectBoundingBox"><path d={DOME_BB} /></clipPath></defs>
        <path d={DOME} fill="none" stroke={GOLD} strokeWidth="2.4" />
        {/* finial / bell on top */}
        <circle cx="50" cy="5" r="3" fill={GOLD} />
        <line x1="50" y1="8" x2="50" y2="11" stroke={GOLD} strokeWidth="1.5" />
      </svg>
    )
  } else if (type === 'tag') {
    image = <Img cat={cat} style={{ inset: 0, clipPath: `url(#${uid})` }} />
    frame = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs><clipPath id={uid} clipPathUnits="objectBoundingBox"><path d={TAG_BB} /></clipPath></defs>
        <path d={TAG} fill="none" stroke={GOLD} strokeWidth="2.4" />
      </svg>
    )
  } else if (type === 'lotus') {
    image = <Img cat={cat} className="rounded-full" style={{ inset: '16%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {ring(35, 1.5)}
        {radial(12, 43, (cx, cy, deg) => <path d="M0,-9 C-3,-3 -3,2 0,5 C3,2 3,-3 0,-9 Z" fill={GOLD} transform={`translate(${cx} ${cy}) rotate(${deg})`} />)}
        {ring(48, 0.8, 0.6)}
      </svg>
    )
  } else {
    // simple circle
    image = <Img cat={cat} className="rounded-full" style={{ inset: '10%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {ring(40, 2)}
      </svg>
    )
  }

  return (
    <Link href={`/products?category=${cat.slug}`} className="group flex flex-col items-center flex-shrink-0 w-[200px] md:w-[230px]">
      <div className="relative w-full aspect-square">
        {image}
        {frame}
      </div>
      <span className="mt-3 text-base font-medium text-[#4E1E24] text-center group-hover:text-[#C2185B] transition-colors leading-tight">{cat.name}</span>
    </Link>
  )
}

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button onClick={() => scroll('left')} aria-label="Previous" className="absolute -left-2 md:-left-4 top-[42%] -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-[#4E1E24] hover:bg-[#C2185B] hover:text-white transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div ref={scroller} className="flex gap-6 overflow-x-auto scroll-smooth px-1 py-2" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat, idx) => (
          <CategoryCard key={cat.slug} cat={cat} idx={idx} />
        ))}
      </div>

      <button onClick={() => scroll('right')} aria-label="Next" className="absolute -right-2 md:-right-4 top-[42%] -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-[#4E1E24] hover:bg-[#C2185B] hover:text-white transition-colors">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
