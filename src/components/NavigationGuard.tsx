'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Confirms before the user navigates away from the current page.
 *
 * Intercepts in-app link clicks and the browser Back button and shows a
 * styled confirmation dialog ("Stay on Page" / "Leave Page"). A page refresh
 * or tab close falls back to the browser's own prompt (only when `enabled`),
 * which browsers won't let us style.
 *
 * Mount it once on a page/section you want guarded (e.g. the admin layout or
 * the checkout page). Programmatic navigation via router.push() is NOT
 * intercepted, so a successful "Save" that redirects still works silently.
 */
export default function NavigationGuard({
  enabled = true,
  warnOnRefresh = false,
}: {
  enabled?: boolean
  warnOnRefresh?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null) // pending destination
  const backPending = useRef(false)

  // ---- Intercept clicks on internal links (capture phase, before Next's router) ----
  useEffect(() => {
    if (!enabled) return
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const el = (e.target as HTMLElement)?.closest('a')
      if (!el) return
      const href = el.getAttribute('href')
      const target = el.getAttribute('target')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (target && target !== '_self') return
      // External links → let the browser handle (beforeunload will guard if on).
      if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) return
      // Same page → nothing to guard.
      const dest = href.split('#')[0]
      if (dest === window.location.pathname) return

      e.preventDefault()
      e.stopPropagation()
      setPending(href)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [enabled])

  // ---- Guard the browser Back / Forward button ----
  useEffect(() => {
    if (!enabled) return
    // Push a sentinel state so the first Back press lands here instead of leaving.
    window.history.pushState(null, '', window.location.href)
    const onPop = () => {
      // Re-plant the sentinel and ask the user.
      window.history.pushState(null, '', window.location.href)
      backPending.current = true
      setPending('__back__')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [enabled])

  // ---- Refresh / tab close (native prompt only; can't be styled) ----
  useEffect(() => {
    if (!enabled || !warnOnRefresh) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled, warnOnRefresh])

  const stay = () => {
    backPending.current = false
    setPending(null)
  }

  const leave = () => {
    const dest = pending
    setPending(null)
    if (dest === '__back__') {
      backPending.current = false
      // Step back twice to clear the sentinel we planted.
      window.history.go(-2)
      return
    }
    if (dest) router.push(dest)
  }

  if (!pending) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={stay} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="navguard-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="navguard-title" className="text-lg font-semibold text-gray-900">
          Are you sure you want to leave?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Any unsaved changes will be lost.
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={leave}
            className="h-11 px-4 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            Leave Page
          </button>
          <button
            type="button"
            onClick={stay}
            autoFocus
            className="h-11 px-5 rounded-lg bg-[#C2185B] text-white font-semibold hover:bg-[#a01049] transition-colors"
          >
            Stay on Page
          </button>
        </div>
      </div>
    </div>
  )
}
