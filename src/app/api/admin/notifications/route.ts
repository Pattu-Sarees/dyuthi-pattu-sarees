import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

// GET: latest notifications + unread count
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const [{ data }, { count }] = await Promise.all([
    admin.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
    admin.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
  ])
  return NextResponse.json({ notifications: data || [], unread: count || 0 })
}

// PATCH: mark one ({ id }) or all ({ all: true }) as read
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  let q = admin.from('notifications').update({ is_read: true })
  if (body.all) q = q.eq('is_read', false)
  else if (body.id) q = q.eq('id', body.id)
  else return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
