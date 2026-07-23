'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

export type RangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom'
export interface CustomRange { start: string; end: string } // yyyy-mm-dd

export const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom Date Range' },
]

export function presetLabel(p: RangePreset) { return PRESETS.find((x) => x.key === p)?.label || 'This Month' }

// Compute the actual [from, to) Date window for a preset (or custom range).
export function computeRange(preset: RangePreset, custom?: CustomRange): { from: Date; to: Date } {
  const now = new Date()
  const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  switch (preset) {
    case 'today': return { from: sod(now), to: now }
    case 'yesterday': { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: sod(y), to: sod(now) } }
    case 'last7': { const f = new Date(now); f.setDate(now.getDate() - 6); return { from: sod(f), to: now } }
    case 'last30': { const f = new Date(now); f.setDate(now.getDate() - 29); return { from: sod(f), to: now } }
    case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    case 'lastMonth': return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) }
    case 'quarter': { const q = Math.floor(now.getMonth() / 3) * 3; return { from: new Date(now.getFullYear(), q, 1), to: now } }
    case 'year': return { from: new Date(now.getFullYear(), 0, 1), to: now }
    case 'custom': {
      const f = custom?.start ? new Date(`${custom.start}T00:00:00`) : sod(now)
      const t = custom?.end ? new Date(`${custom.end}T23:59:59.999`) : now
      return { from: f, to: t }
    }
    default: return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
  }
}

export default function DateRangeFilter({ preset, custom, onChange }: { preset: RangePreset; custom: CustomRange; onChange: (p: RangePreset, c?: CustomRange) => void }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(custom.start)
  const [end, setEnd] = useState(custom.end)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = (p: RangePreset) => {
    if (p === 'custom') return // handled by Apply
    onChange(p)
    setOpen(false)
  }
  const applyCustom = () => {
    if (!start || !end) return
    onChange('custom', { start, end })
    setOpen(false)
  }

  const label = preset === 'custom' && custom.start && custom.end ? `${custom.start} → ${custom.end}` : presetLabel(preset)

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-[#AD1457] transition-colors">
        <Calendar className="h-4 w-4 text-[#AD1457]" /> <span className="max-w-[180px] truncate">{label}</span> <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50 py-1">
          {PRESETS.filter((p) => p.key !== 'custom').map((p) => (
            <button key={p.key} onClick={() => pick(p.key)} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${preset === p.key ? 'text-[#AD1457] font-medium bg-rose-50/50' : 'text-gray-700'}`}>{p.label}</button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-2 px-3 pb-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">Custom Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} className="h-9 rounded-lg border border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />
              <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className="h-9 rounded-lg border border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />
            </div>
            <button onClick={applyCustom} disabled={!start || !end} className="w-full mt-2 h-9 rounded-lg bg-[#AD1457] hover:bg-[#880E4F] text-white text-xs font-semibold disabled:opacity-50">Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}
