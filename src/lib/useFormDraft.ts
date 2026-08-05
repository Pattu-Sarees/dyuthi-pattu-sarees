'use client'

import { useEffect, useRef } from 'react'

const DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Persist a form's state to localStorage so a page refresh (or accidental
 * navigation) doesn't wipe what the user typed. The draft is kept for `ttlMs`
 * (default 10 minutes) and restored on mount if still fresh.
 *
 * Usage:
 *   const [form, setForm] = useState(initial)
 *   useFormDraft('draft:product:new', form, setForm)
 *   // on successful save: clearFormDraft('draft:product:new')
 */
export function useFormDraft<T>(
  key: string,
  state: T,
  setState: (value: T) => void,
  ttlMs: number = DEFAULT_TTL,
) {
  const restored = useRef(false)

  // Restore once, on mount.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as { t: number; data: T }
      if (parsed && typeof parsed.t === 'number' && Date.now() - parsed.t < ttlMs) {
        // Merge saved values OVER the current defaults for plain objects, so a
        // draft saved before a new field existed doesn't drop that field
        // (which would make things like `form.video_urls.map` crash).
        const savedIsPlainObject =
          parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
        const currentIsPlainObject =
          state && typeof state === 'object' && !Array.isArray(state)
        if (savedIsPlainObject && currentIsPlainObject) {
          setState({ ...(state as object), ...(parsed.data as object) } as T)
        } else {
          setState(parsed.data)
        }
      } else {
        localStorage.removeItem(key) // expired
      }
    } catch {
      /* ignore malformed drafts */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Save on change (debounced) — but not before the initial restore has run,
  // so we never overwrite a saved draft with the empty initial state.
  useEffect(() => {
    if (!restored.current) return
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: state }))
      } catch {
        /* quota / private mode — ignore */
      }
    }, 400)
    return () => clearTimeout(id)
  }, [key, state])
}

/** Remove a saved draft (call after a successful save). */
export function clearFormDraft(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
