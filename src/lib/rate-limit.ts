// Lightweight in-memory rate limiter — no external service required.
//
// Trade-off: the counter lives in the server function's memory, so it is
// per-instance (a cold start resets it; multiple concurrent instances each keep
// their own). For a low-traffic store that's usually one warm instance, so it
// behaves ~globally and blocks naive spam / brute-force bursts. For guaranteed
// distributed limits at scale, swap this for Upstash Ratelimit later.

type Hit = { count: number; reset: number }
const store = new Map<string, Hit>()

// Occasionally sweep expired entries so the map can't grow unbounded.
function sweep(now: number) {
  if (store.size < 5000) return
  for (const [k, v] of store) if (now > v.reset) store.delete(k)
}

/**
 * Fixed-window limiter. Returns { ok:false, retryAfter } once `limit` requests
 * are seen for `key` within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  sweep(now)
  const hit = store.get(key)
  if (!hit || now > hit.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  hit.count++
  if (hit.count > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((hit.reset - now) / 1000)) }
  return { ok: true, retryAfter: 0 }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || ''
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

/** Standard 429 response for a blocked request. */
export function tooMany(retryAfter: number) {
  return new Response(JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  })
}
