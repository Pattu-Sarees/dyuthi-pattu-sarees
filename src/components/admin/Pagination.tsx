'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  if (total <= 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  // Windowed page numbers (first, last, and neighbours of the current page).
  const nums: number[] = []
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= page - 1 && p <= page + 1)) nums.push(p)
  }
  const withGaps: number[] = []
  let prev = 0
  for (const p of nums) {
    if (prev && p - prev > 1) withGaps.push(-1)
    withGaps.push(p)
    prev = p
  }

  const arrow = 'inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600 hover:border-[#AD1457] hover:text-[#AD1457] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors'

  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}–{end}</span> of <span className="font-medium text-gray-700">{total}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={arrow} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          {withGaps.map((p, i) =>
            p === -1 ? (
              <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`h-8 min-w-8 px-2.5 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#AD1457] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} className={arrow} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}
