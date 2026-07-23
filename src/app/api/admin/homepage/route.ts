import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { getHomepageSections, isValidSectionKey } from '@/lib/homepage'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sections = await getHomepageSections()
  return NextResponse.json({ sections })
}

// PATCH a single section by key, or bulk-reorder.
// Body: { key, enabled?, title?, subtitle?, images?, data? }
//   or: { reorder: [{ key, sort_order }, ...] }
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const admin = createAdminClient()

  if (Array.isArray(body.reorder)) {
    for (const r of body.reorder) {
      if (!isValidSectionKey(r.key)) continue
      await admin.from('homepage_sections').update({ sort_order: Number(r.sort_order) || 0 }).eq('key', r.key)
    }
    const sections = await getHomepageSections()
    return NextResponse.json({ sections })
  }

  if (!isValidSectionKey(body.key)) return NextResponse.json({ error: 'Invalid section key' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.enabled !== undefined) patch.enabled = !!body.enabled
  if (body.title !== undefined) patch.title = body.title ?? null
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle ?? null
  if (body.images !== undefined) patch.images = Array.isArray(body.images) ? body.images : []
  if (body.data !== undefined && typeof body.data === 'object') patch.data = body.data

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await admin.from('homepage_sections').update(patch).eq('key', body.key).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data })
}
