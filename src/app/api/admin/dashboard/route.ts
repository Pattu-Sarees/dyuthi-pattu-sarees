import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { getDashboardMetrics, DashboardMetrics } from '@/lib/dashboard'

// Small in-memory cache keyed by date range (per server instance).
const cache = new Map<string, { at: number; data: DashboardMetrics }>()
const TTL = 60_000 // 1 minute

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  const range = from && to ? { from, to } : undefined
  const key = range ? `${from}|${to}` : 'default'

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data)

  try {
    const data = await getDashboardMetrics(range)
    cache.set(key, { at: Date.now(), data })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
