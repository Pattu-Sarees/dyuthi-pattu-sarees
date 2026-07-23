import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { ADMIN_ORDER_STATUSES, PAYMENT_STATUSES, ORDER_SOURCES } from '@/types'
import { applyDeliveryStockDecrement } from '@/lib/inventory-server'
import { notify, logActivity } from '@/lib/notify-server'

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const patch: Record<string, unknown> = {}
  if (body.status !== undefined && ADMIN_ORDER_STATUSES.includes(body.status)) patch.status = body.status
  if (body.payment_status !== undefined && PAYMENT_STATUSES.includes(body.payment_status)) patch.payment_status = body.payment_status
  if (body.source !== undefined && ORDER_SOURCES.includes(body.source)) patch.source = body.source
  if (body.customer_name !== undefined) patch.customer_name = body.customer_name?.trim() || null
  if (body.customer_phone !== undefined) patch.customer_phone = body.customer_phone?.trim() || null
  if (body.customer_email !== undefined) {
    const email = (body.customer_email || '').trim()
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    patch.customer_email = email || null
  }
  if (body.customer_country_code !== undefined) patch.customer_country_code = body.customer_country_code?.trim() || null
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number?.trim() || null

  // Address / pincode (stored as jsonb)
  if (body.address !== undefined || body.pincode !== undefined) {
    const line1 = (body.address || '').trim()
    const pincode = (body.pincode || '').trim()
    const code = (body.customer_country_code || '').trim()
    const nat = (body.customer_phone || '').trim()
    patch.address = line1 || pincode
      ? { name: (body.customer_name || '').trim() || null, phone: nat ? `${code} ${nat}`.trim() : null, line1, pincode }
      : null
  }

  const newItems: Array<{ product_id?: string | null; product_name: string; product_image?: string | null; quantity: number; price: number }> | null =
    Array.isArray(body.items) ? body.items : null

  if (Object.keys(patch).length === 0 && !newItems) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()

  // Replace the order's items and recompute the total.
  if (newItems) {
    if (newItems.length === 0) return NextResponse.json({ error: 'Order must have at least one product' }, { status: 400 })
    const { data: existing } = await admin.from('orders').select('shipping_amount, discount_amount').eq('id', id).single()
    await admin.from('order_items').delete().eq('order_id', id)
    const rows = newItems.map((it) => ({
      order_id: id,
      product_id: it.product_id || null,
      product_name: it.product_name,
      product_image: it.product_image || null,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
    }))
    const { error: itemsErr } = await admin.from('order_items').insert(rows)
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    const subtotal = rows.reduce((s, r) => s + r.price * r.quantity, 0)
    patch.total_amount = Math.max(0, subtotal + (existing?.shipping_amount || 0) - (existing?.discount_amount || 0))
  }

  // On the first transition into "delivered": bump sold_count AND decrement the
  // exact colour the customer bought (so a sold-out colour auto-shows "Out").
  if (patch.status === 'delivered') {
    const { data: existing } = await admin.from('orders').select('status, order_number').eq('id', id).single()
    if (existing && existing.status !== 'delivered') {
      const { data: items } = await admin.from('order_items').select('product_id,quantity').eq('order_id', id)
      await Promise.all((items || [])
        .filter((it) => it.product_id)
        .map((it) => admin.rpc('increment_sold', { pid: it.product_id, qty: Number(it.quantity) || 0 })))
      await applyDeliveryStockDecrement(admin, id, existing.order_number || id.slice(0, 8), user.email ?? null)
    }
  }

  const { data, error } = await admin.from('orders').update(patch).eq('id', id).select('*, items:order_items(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (patch.status !== undefined) {
    const label = data.order_number || id.slice(0, 8)
    await logActivity(admin, { adminEmail: user.email ?? null, action: 'order_status_changed', entity: 'order', entityId: id, detail: `${label} → ${patch.status}` })
    if (patch.status === 'cancelled') {
      await notify(admin, { type: 'order_cancelled', title: `Order ${label} cancelled`, body: data.customer_name || null, link: '/admin/orders' })
    }
  }
  return NextResponse.json({ order: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('orders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
