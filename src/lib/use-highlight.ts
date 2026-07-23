'use client'

import { useEffect, useState } from 'react'

// Reads ?highlight=<id> from the URL, returns it so a matching row can show a
// temporary red outline, scrolls it into view, cleans the URL, and clears after
// a few seconds. Use `data-hl={id}` on the row for the scroll to find it.
export function useHighlight(basePath: string): string | null {
  const [highlight, setHighlight] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const h = params.get('highlight')
    if (!h) return
    window.history.replaceState(null, '', basePath)
    setTimeout(() => setHighlight(h), 0)
    // Scroll once the list has had time to load + paginate to the item.
    const scroll = setTimeout(() => {
      try { document.querySelector(`[data-hl="${CSS.escape(h)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch {}
    }, 500)
    const clear = setTimeout(() => setHighlight(null), 5000)
    return () => { clearTimeout(scroll); clearTimeout(clear) }
  }, [basePath])

  return highlight
}

// Ring classes for a highlighted row/card (prominent red).
export const HIGHLIGHT_RING = 'ring-2 ring-red-500 ring-offset-2 bg-red-50/40'
