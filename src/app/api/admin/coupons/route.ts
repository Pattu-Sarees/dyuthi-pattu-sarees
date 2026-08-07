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

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ coupons: [] })
  return NextResponse.json({ coupons: data || [] })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const code = (body.code || '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const discount_type = DISCOUNT_TYPES.includes(body.discount_type) ? body.discount_type : 'percent'
  const discount_value = Number(body.discount_value)
  if (!Number.isFinite(discount_value) || discount_value < 0) return NextResponse.json({ error: 'Invalid discount value' }, { status: 400 })
  if (discount_type === 'percent' && discount_value > 100) return NextResponse.json({ error: 'Percent discount cannot exceed 100' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').insert({
    code,
    discount_type,
    discount_value,
    min_order_value: Number(body.min_order_value) || 0,
    max_order_value: body.max_order_value ? Number(body.max_order_value) : null,
    max_daily_uses: body.max_daily_uses ? Number(body.max_daily_uses) : null,
    description: body.description ? String(body.description).trim().slice(0, 160) : null,
    per_user_limit: body.per_user_limit ? Number(body.per_user_limit) : null,
    once_per_user: !!body.once_per_user,
    new_users_only: !!body.new_users_only,
    existing_users_only: !!body.existing_users_only,
    allow_guests: body.allow_guests !== false,
    expiry_date: body.expiry_date || null,
    usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
    is_active: body.is_active !== false,
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ coupon: data })
}
