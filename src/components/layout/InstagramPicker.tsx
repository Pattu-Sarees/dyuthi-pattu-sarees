'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'

const IgGlyph = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export type InstaAccount = { label: string; url: string }

// One Instagram icon in the footer that opens a small picker (desktop popover /
// mobile bottom sheet) listing our Instagram profiles. Selecting one opens it in
// a new tab and closes the picker. Keyboard + outside-click accessible.
export default function InstagramPicker({ accounts }: { accounts: InstaAccount[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)

  // Close on outside click + Escape; focus the first item when opened.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => firstItemRef.current?.focus(), 0)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [open])

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Follow us on Instagram"
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 bg-white/10 rounded-md hover:bg-[#C2185B] transition-colors text-current"
      >
        {/* match the footer's outline Instagram glyph */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <>
          {/* Mobile scrim (bottom sheet) — desktop popover ignores it */}
          <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setOpen(false)} aria-hidden />

          <div
            role="menu"
            aria-label="Follow Us On Instagram"
            className="z-50 overflow-hidden bg-white text-gray-800 shadow-xl
                       fixed inset-x-0 bottom-0 rounded-t-2xl
                       sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-72 sm:rounded-xl sm:border sm:border-gray-100"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:pt-3">
              <p className="text-sm font-semibold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
                Follow Us On Instagram
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700 sm:hidden">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-2 pb-3 sm:pb-2">
              {accounts.map((a, i) => (
                <a
                  key={a.url}
                  ref={i === 0 ? firstItemRef : undefined}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none transition-colors"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)' }}>
                    <IgGlyph className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{a.label}</span>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#C2185B] flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
