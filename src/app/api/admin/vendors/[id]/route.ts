import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { logActivity } from '@/lib/notify-server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (typeof body.vendor_name === 'string') {
    const name = body.vendor_name.trim()
    if (!name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    patch.vendor_name = name
  }
  if (typeof body.notes === 'string') patch.notes = body.notes.trim() || null
  if (body.status === 'active' || body.status === 'inactive') patch.status = body.status
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('vendors').update(patch).eq('id', id).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A vendor with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await logActivity(admin, { adminEmail: user.email ?? null, action: 'vendor_updated', entity: 'vendor', entityId: id, detail: data.vendor_name })
  return NextResponse.json({ vendor: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // Products referencing this vendor keep their procurement data; vendor_id
  // becomes null via the FK's on delete set null.
  const { error } = await admin.from('vendors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logActivity(admin, { adminEmail: user.email ?? null, action: 'vendor_deleted', entity: 'vendor', entityId: id })
  return NextResponse.json({ success: true })
}
