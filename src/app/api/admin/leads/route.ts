import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { LEAD_SOURCES, LEAD_STATUSES } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { count, data, error } = await admin
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // If the leads table doesn't exist yet, return 0 gracefully
  if (error) return NextResponse.json({ count: 0, leads: [] })
  return NextResponse.json({ count: count || 0, leads: data || [] })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = (body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const source = LEAD_SOURCES.includes(body.source) ? body.source : 'website'
  const status = LEAD_STATUSES.includes(body.status) ? body.status : 'new'

  const admin = createAdminClient()
  const { data, error } = await admin.from('leads').insert({
    name,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    message: body.message?.trim() || null,
    source,
    status,
    notes: body.notes?.trim() || null,
    follow_up_date: body.follow_up_date || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
