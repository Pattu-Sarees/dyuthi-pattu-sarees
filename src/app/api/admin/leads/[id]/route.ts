import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { LEAD_SOURCES, LEAD_STATUSES } from '@/types'
import { logActivity } from '@/lib/notify-server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const patch: Record<string, unknown> = {}
  if (body.status !== undefined && LEAD_STATUSES.includes(body.status)) patch.status = body.status
  if (body.source !== undefined && LEAD_SOURCES.includes(body.source)) patch.source = body.source
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null
  if (body.follow_up_date !== undefined) patch.follow_up_date = body.follow_up_date || null
  if (body.name !== undefined) patch.name = body.name?.trim()
  if (body.phone !== undefined) patch.phone = body.phone?.trim() || null
  if (body.email !== undefined) patch.email = body.email?.trim() || null

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('leads').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (patch.status === 'converted') {
    await logActivity(admin, { action: 'lead_converted', entity: 'lead', entityId: id, detail: data.name })
  }
  return NextResponse.json({ lead: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const admin = createAdminClient()
  const { error } = await admin.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
