import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { DISCOUNT_TYPES } from '@/types'

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
  if (body.code !== undefined) patch.code = (body.code || '').trim().toUpperCase()
  if (body.discount_type !== undefined && DISCOUNT_TYPES.includes(body.discount_type)) patch.discount_type = body.discount_type
  if (body.discount_value !== undefined) patch.discount_value = Number(body.discount_value)
  if (body.min_order_value !== undefined) patch.min_order_value = Number(body.min_order_value) || 0
  if (body.expiry_date !== undefined) patch.expiry_date = body.expiry_date || null
  if (body.usage_limit !== undefined) patch.usage_limit = body.usage_limit ? Number(body.usage_limit) : null
  if (body.is_active !== undefined) patch.is_active = !!body.is_active

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').update(patch).eq('id', id).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ coupon: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
