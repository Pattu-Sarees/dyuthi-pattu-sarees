import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderNumber } from '@/lib/order-number'
import { notify } from '@/lib/notify-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { items, address, total_amount, shipping_amount, payment_method, payment_id, payment_status } = body

  // Global order number via service-role client (RLS-safe count).
  const orderNumber = await generateOrderNumber(createAdminClient())

  const { data: order, error } = await supabase
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
      total_amount,
      shipping_amount,
      discount_amount: 0,
      address,
      payment_method,
      payment_id,
      payment_status: payment_status || 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orderItems = items.map((item: {
    product_id: string
    product_name: string
    product_image: string
    quantity: number
    price: number
  }) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  await notify(createAdminClient(), {
    type: 'new_order',
    title: `New online order ${orderNumber}`,
    body: `${address?.name || 'A customer'} · ₹${Number(total_amount || 0).toLocaleString('en-IN')}`,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders })
}
