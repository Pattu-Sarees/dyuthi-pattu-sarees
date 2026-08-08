'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'

export type WaAccount = { label: string; url: string }

const WaGlyph = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.463.044.104 5.403.101 11.986c0 2.096.548 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.9 11.9 0 00-3.481-8.418z" />
  </svg>
)

// One WhatsApp icon in the footer that opens a picker of our WhatsApp numbers
// (desktop popover / mobile bottom sheet). Selecting one opens the chat.
export default function WhatsAppPicker({ accounts }: { accounts: WaAccount[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)

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
        aria-label="Chat with us on WhatsApp"
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 bg-white/10 rounded-md hover:bg-[#25D366] transition-colors text-current"
      >
        <WaGlyph />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            aria-label="Chat With Us On WhatsApp"
            className="z-50 overflow-hidden bg-white text-gray-800 shadow-xl
                       fixed inset-x-0 bottom-0 rounded-t-2xl
                       sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-72 sm:rounded-xl sm:border sm:border-gray-100"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:pt-3">
              <p className="text-sm font-semibold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
                Chat With Us On WhatsApp
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
                  className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-green-50 focus:bg-green-50 focus:outline-none transition-colors"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white">
                    <WaGlyph className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{a.label}</span>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#25D366] flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
