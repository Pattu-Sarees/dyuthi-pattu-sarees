import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { ADMIN_ORDER_STATUSES, PAYMENT_STATUSES, ORDER_SOURCES } from '@/types'
import { generateOrderNumber } from '@/lib/order-number'
import { notify, logActivity } from '@/lib/notify-server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

async function adminEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ orders: [] })
  return NextResponse.json({ orders: data || [] })
}

interface NewItem { product_id?: string | null; product_name: string; product_image?: string | null; quantity: number; price: number }

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const customer_name = (body.customer_name || '').trim()
  const items: NewItem[] = Array.isArray(body.items) ? body.items : []
  if (!customer_name) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
  if (items.length === 0) return NextResponse.json({ error: 'Add at least one product' }, { status: 400 })

  const status = ADMIN_ORDER_STATUSES.includes(body.status) ? body.status : 'confirmed'
  const payment_status = PAYMENT_STATUSES.includes(body.payment_status) ? body.payment_status : 'pending'
  // Manual orders are offline by default; validate against known channels.
  const source = ORDER_SOURCES.includes(body.source) ? body.source : 'walk-in'
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
  const shipping_amount = Number(body.shipping_amount) || 0
  const discount_amount = Number(body.discount_amount) || 0
  const total_amount = Math.max(0, subtotal + shipping_amount - discount_amount)

  const admin = createAdminClient()
  const orderNumber = await generateOrderNumber(admin)

  const customer_country_code = (body.customer_country_code || '+91').trim()
  const customer_phone = body.customer_phone?.trim() || null
  const emailRaw = (body.customer_email || '').trim()
  if (emailRaw && !isValidEmail(emailRaw)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }
  const customer_email = emailRaw || null

  // Manual order address (stored as jsonb).
  const addressLine = (body.address || '').trim()
  const pincode = (body.pincode || '').trim()
  const address = addressLine || pincode
    ? { name: customer_name, phone: customer_phone ? `${customer_country_code} ${customer_phone}` : null, line1: addressLine, pincode }
    : null

  const { data: order, error: orderErr } = await admin.from('orders').insert({
    order_number: orderNumber,
    customer_name,
    customer_country_code,
    customer_phone,
    customer_email,
    status,
    payment_status,
    source,
    address,
    payment_method: body.payment_method || 'manual',
    total_amount,
    shipping_amount,
    discount_amount,
  }).select().single()

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

  const rows = items.map((it) => ({
    order_id: order.id,
    product_id: it.product_id || null,
    product_name: it.product_name,
    product_image: it.product_image || null,
    quantity: Number(it.quantity) || 1,
    price: Number(it.price) || 0,
  }))
  const { error: itemsErr } = await admin.from('order_items').insert(rows)
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  const email = await adminEmail()
  await notify(admin, { type: 'new_order', title: `New order ${orderNumber}`, body: `${customer_name} · ₹${Number(total_amount).toLocaleString('en-IN')}`, link: '/admin/orders' })
  await logActivity(admin, { adminEmail: email, action: 'order_created', entity: 'order', entityId: order.id, detail: orderNumber })

  return NextResponse.json({ order: { ...order, order_items: rows } })
}
