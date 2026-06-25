'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Category = { name: string; slug: string; img: string }

const GOLD = '#D4AF37'
const ANTIQUE = '#C9A227'
const IVORY = '#FBF6EA'

// Build a smooth lotus-bloom (scalloped flower) path
function flowerPath(c: number, ri: number, rc: number, n: number) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI
    const a1 = ((i + 1) / n) * 2 * Math.PI
    const am = (a0 + a1) / 2
    const vx1 = c + ri * Math.sin(a1)
    const vy1 = c - ri * Math.cos(a1)
    const px = c + rc * Math.sin(am)
    const py = c - rc * Math.cos(am)
    if (i === 0) d += `M${(c + ri * Math.sin(a0)).toFixed(3)},${(c - ri * Math.cos(a0)).toFixed(3)} `
    d += `Q${px.toFixed(3)},${py.toFixed(3)} ${vx1.toFixed(3)},${vy1.toFixed(3)} `
  }
  return d + 'Z'
}
const FLOWER_OUTER = flowerPath(50, 37, 50, 14)
const FLOWER_INNER_BB = flowerPath(0.5, 0.34, 0.45, 14)

// Scalloped (petal-edge) frame — finer, shallower lobes
const SCALLOP_OUTER = flowerPath(50, 45, 49.5, 18)
const SCALLOP_BB = flowerPath(0.5, 0.44, 0.49, 18)

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
  const type = FRAME_BY_SLUG[cat.slug] || 'scallop'
  const uid = `frame${idx}`
  let image: React.ReactNode
  let frame: React.ReactNode
  let back: React.ReactNode = null
  const aspect = type === 'scallop' ? 'aspect-[4/5]' : 'aspect-square'

  if (type === 'scallop') {
    image = <Img cat={cat} style={{ inset: 0, clipPath: `url(#${uid})` }} />
    frame = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={uid} clipPathUnits="objectBoundingBox"><path d={SCALLOP_BB} /></clipPath>
        </defs>
        <path d={SCALLOP_OUTER} fill="none" stroke="#4E1E24" strokeWidth="1.1" />
      </svg>
    )
  } else if (type === 'medallionfloral') {
    const flower = (cx: number, cy: number, s: number) => (
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        {Array.from({ length: 5 }).map((_, k) => (
          <ellipse key={k} cx="0" cy="-2.3" rx="1.1" ry="2.3" fill="none" stroke={ANTIQUE} strokeWidth="0.7" transform={`rotate(${k * 72})`} />
        ))}
        <circle cx="0" cy="0" r="0.8" fill={ANTIQUE} />
      </g>
    )
    image = <Img cat={cat} className="rounded-full" style={{ inset: '15%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {ring(46, 1)}
        {ring(35.5, 1.2)}
        {/* leaves between flowers (offset half a step) */}
        <g transform="rotate(15 50 50)">
          {radial(12, 41, (cx, cy, deg) => <path d="M0,0 C1.6,-2.6 5,-2.6 6.5,0 C5,2.6 1.6,2.6 0,0 Z" fill="none" stroke={ANTIQUE} strokeWidth="0.6" transform={`translate(${cx} ${cy}) rotate(${deg + 90})`} />)}
        </g>
        {/* ring of flowers */}
        {radial(12, 41, (cx, cy) => flower(cx, cy, 0.85))}
      </svg>
    )
  } else if (type === 'floral') {
    const INK = '#1f1f1f'
    const leaf = (x: number, y: number, r: number, s = 1) => (
      <path d="M0,0 C2,-3.2 6.5,-3.2 8.5,0 C6.5,3.2 2,3.2 0,0 Z" fill="none" stroke={INK} strokeWidth="0.8" transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
    )
    const flower = (x: number, y: number, s: number) => (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {Array.from({ length: 5 }).map((_, k) => (
          <ellipse key={k} cx="0" cy="-2.4" rx="1.2" ry="2.4" fill="none" stroke={INK} strokeWidth="0.8" transform={`rotate(${k * 72})`} />
        ))}
        <circle cx="0" cy="0" r="0.7" fill={INK} />
      </g>
    )
    const bud = (x: number, y: number, r: number) => (
      <path d="M0,0 C2,-4 5,-4 6,0 C5,3 2,3 0,0 Z" fill="none" stroke={INK} strokeWidth="0.8" transform={`translate(${x} ${y}) rotate(${r})`} />
    )
    image = <Img cat={cat} className="rounded-full" style={{ inset: '9%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke={INK} strokeWidth="1" />
        {/* botanical branch sweeping along the bottom and up the right */}
        <path d="M22,74 C30,86 46,90 62,86 C76,82 84,68 85,52" fill="none" stroke={INK} strokeWidth="0.9" />
        {/* leaves in opposite pairs along the branch */}
        {leaf(31, 81, 205)} {leaf(31, 85, 25)}
        {leaf(41, 86, 195)} {leaf(41, 90, 15)}
        {leaf(51, 87, 184)} {leaf(51, 91, 6)}
        {leaf(61, 86, 168)} {leaf(62, 89, -12)}
        {leaf(70, 81, 150)} {leaf(73, 79, -34)}
        {leaf(78, 71, 132)} {leaf(81, 69, -52)}
        {leaf(82, 61, 118)}
        {/* flowers and bud near the branch tip */}
        {flower(85, 50, 1.05)}
        {flower(79, 44, 0.9)}
        {bud(87, 44, 30)}
        {/* a small flower at the lower-left start */}
        {flower(20, 66, 1)}
      </svg>
    )
  } else if (type === 'pallu') {
    image = <Img cat={cat} style={{ inset: 0, clipPath: `url(#${uid})` }} />
    frame = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={uid} clipPathUnits="objectBoundingBox"><path d={TAG_BB} /></clipPath>
        </defs>
        <path d={TAG} fill="none" stroke={GOLD} strokeWidth="2.4" />
        {/* pallu zari border stripes */}
        <line x1="31" y1="62" x2="69" y2="62" stroke={GOLD} strokeWidth="1" />
        <line x1="35" y1="67" x2="65" y2="67" stroke={GOLD} strokeWidth="0.8" opacity="0.8" />
        {/* fringe / tassels at the fold */}
        {[44, 47, 50, 53, 56].map((x) => (
          <line key={x} x1={x} y1="90" x2={x} y2="97" stroke={GOLD} strokeWidth="0.8" />
        ))}
      </svg>
    )
  } else if (type === 'lotuszari') {
    back = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <path d={FLOWER_OUTER} fill={IVORY} />
      </svg>
    )
    image = <Img cat={cat} style={{ inset: 0, clipPath: `url(#${uid})` }} />
    frame = (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={uid} clipPathUnits="objectBoundingBox"><path d={FLOWER_INNER_BB} /></clipPath>
        </defs>
        {/* antique gold zari outline */}
        <path d={FLOWER_OUTER} fill="none" stroke={ANTIQUE} strokeWidth="2.6" />
        <path d={FLOWER_OUTER} fill="none" stroke={ANTIQUE} strokeWidth="0.7" opacity="0.55" transform="scale(0.92) translate(4.35 4.35)" />
        {/* zari beads */}
        {radial(28, 44.5, (cx, cy) => <circle cx={cx} cy={cy} r="0.9" fill={ANTIQUE} />)}
        <circle cx="50" cy="50" r="33.5" fill="none" stroke={ANTIQUE} strokeWidth="0.8" opacity="0.7" />
      </svg>
    )
  } else if (type === 'jewel') {
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
  } else if (type === 'wheel') {
    // Handloom / spinning wheel frame
    image = <Img cat={cat} className="rounded-full" style={{ inset: '15%' }} />
    frame = (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {ring(37, 1.5)}
        {ring(46, 1.2)}
        {Array.from({ length: 48 }).map((_, i) => {
          const a = ((i * 360) / 48) * (Math.PI / 180)
          return (
            <line
              key={i}
              x1={50 + 38 * Math.sin(a)}
              y1={50 - 38 * Math.cos(a)}
              x2={50 + 45 * Math.sin(a)}
              y2={50 - 45 * Math.cos(a)}
              stroke={GOLD}
              strokeWidth="0.8"
            />
          )
        })}
        {radial(8, 41.5, (cx, cy) => <circle cx={cx} cy={cy} r="1.4" fill={GOLD} />)}
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
    <Link href={`/products?category=${cat.slug}`} className="group flex flex-col items-center flex-shrink-0 w-[185px] md:w-[210px]">
      <div className={`relative w-full ${aspect} transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_14px_rgba(194,24,91,0.55))]`}>
        {back}
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
