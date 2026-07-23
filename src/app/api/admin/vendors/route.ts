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

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  let query = admin.from('vendors').select('*').order('created_at', { ascending: false })
  // ?status=active — used by the product form dropdown
  const status = req.nextUrl.searchParams.get('status')
  if (status === 'active' || status === 'inactive') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendors: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const vendor_name = (body.vendor_name || '').trim()
  if (!vendor_name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('vendors').insert({
    vendor_name,
    notes: (body.notes || '').trim() || null,
    status: body.status === 'inactive' ? 'inactive' : 'active',
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A vendor with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await logActivity(admin, { adminEmail: user.email ?? null, action: 'vendor_created', entity: 'vendor', entityId: data.id, detail: data.vendor_name })
  return NextResponse.json({ vendor: data })
}
