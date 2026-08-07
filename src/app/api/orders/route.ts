import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isValidEmail } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderNumber } from '@/lib/order-number'
import { notify } from '@/lib/notify-server'
import { evaluateCoupon, istToday } from '@/lib/coupon'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { items, address, payment_method } = body
  const razorpay_order_id: string | undefined = body.razorpay_order_id
  const razorpay_payment_id: string | undefined = body.payment_id || body.razorpay_payment_id
  const razorpay_signature: string | undefined = body.razorpay_signature

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items in the order' }, { status: 400 })
  }
  // One coupon per order — reject any attempt to pass multiple codes.
  if (Array.isArray(body.coupon_code)) {
    return NextResponse.json({ error: 'Only one coupon can be applied per order.' }, { status: 400 })
  }

  // ---- Verify the Razorpay payment SERVER-SIDE ----
  // Only a payment whose signature checks out may be recorded as 'paid'. This
  // stops a client from POSTing payment_status: 'paid' without actually paying.
  let paid = false
  if (razorpay_payment_id) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id || ''}|${razorpay_payment_id}`)
      .digest('hex')
    paid = !!razorpay_signature && expected.length > 0 &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))
    if (!paid) {
      return NextResponse.json({ error: 'Payment could not be verified' }, { status: 400 })
    }
  }

  // ---- Recompute the amount from real DB prices (never trust the client) ----
  const admin = createAdminClient()
  const ids = [...new Set(items.map((i: { product_id?: string }) => i.product_id).filter(Boolean))] as string[]
  const { data: dbProducts } = await admin.from('products').select('id, price').in('id', ids)
  const priceById = new Map((dbProducts || []).map((p: { id: string; price: number }) => [p.id, Number(p.price)]))
  let subtotal = 0
  for (const it of items as { product_id?: string; quantity?: number }[]) {
    const price = it.product_id ? priceById.get(it.product_id) : undefined
    if (price == null || !Number.isFinite(price)) {
      return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 400 })
    }
    subtotal += price * Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)))
  }
  const serverShipping = subtotal >= 999 ? 0 : 99

  // Re-validate the coupon server-side and recompute the discount (the client
  // value is never trusted). Counters are incremented atomically further down.
  let couponCode: string | null = null
  let couponId: string | null = null
  let discount = 0
  if (typeof body.coupon_code === 'string' && body.coupon_code.trim()) {
    const c = await evaluateCoupon(admin, body.coupon_code, subtotal, { userId: user.id })
    if (c.ok) { couponCode = c.code; couponId = c.couponId; discount = c.discount }
    // If the coupon is no longer valid at this moment, we proceed WITHOUT the
    // discount rather than failing an already-paid order (Phase 1 policy).
  }
  const serverTotal = Math.max(0, subtotal - discount) + serverShipping

  // Global order number via service-role client (RLS-safe count).
  const orderNumber = await generateOrderNumber(admin)

  // Insert via the service-role client (not the user client) so orders can be
  // created ONLY through this verified route — never directly via Supabase REST.
  const { data: order, error } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: 'confirmed',
      source: 'website',
      customer_name: address?.name || null,
      customer_email: (typeof body.customer_email === 'string' && isValidEmail(body.customer_email))
        ? body.customer_email.trim()
        : user.email || null,
      customer_country_code: '+91',
      customer_phone: address?.phone || null,
      total_amount: serverTotal,       // server-computed, not client-supplied
      shipping_amount: serverShipping,
      discount_amount: discount,
      coupon_code: couponCode,
      address,
      payment_method,
      payment_id: razorpay_payment_id || null,
      payment_status: paid ? 'paid' : 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not create order' }, { status: 500 })

  const orderItems = items.map((item: {
    product_id: string
    product_name: string
    product_image: string
    quantity: number
  }) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
    price: priceById.get(item.product_id) ?? 0, // server price, not client-supplied
  }))

  const { error: itemsError } = await admin.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: 'Could not save order items' }, { status: 500 })

  // Record the coupon redemption and atomically bump usage counters. Only for
  // a paid order that actually used a valid coupon. Best-effort: a paid order is
  // never failed here — if the atomic claim loses a rare race, we still keep the
  // order (the redemption row remains the accounting source of truth).
  if (paid && couponId && discount > 0) {
    const { data: c } = await admin.from('coupons').select('usage_limit, max_daily_uses').eq('id', couponId).maybeSingle()
    await admin.rpc('redeem_coupon', {
      p_coupon: couponId,
      p_total_limit: c?.usage_limit ?? null,
      p_daily_limit: c?.max_daily_uses ?? null,
      p_day: istToday(),
    }).then(undefined, () => {})
    await admin.from('coupon_redemptions').insert({
      coupon_id: couponId, order_id: order.id, user_id: user.id, discount_amount: discount, status: 'redeemed',
    }).then(undefined, () => {})
  }

  await notify(admin, {
    type: 'new_order',
    title: `New online order ${orderNumber}`,
    body: `${address?.name || 'A customer'} · ₹${serverTotal.toLocaleString('en-IN')}`,
    link: '/admin/orders',
  })

  return NextResponse.json({ orderId: order.id })
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load your orders' }, { status: 500 })
  return NextResponse.json({ orders })
}
