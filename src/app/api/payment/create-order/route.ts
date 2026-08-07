import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Creates a Razorpay order. The amount is computed SERVER-SIDE from the real
// product prices in the database — never trusted from the client — so a buyer
// cannot tamper with what they're charged.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const items: { product_id?: string; quantity?: number }[] = Array.isArray(body.items) ? body.items : []
  if (items.length === 0) return NextResponse.json({ error: 'No items' }, { status: 400 })

  // Look up authoritative prices from the DB (ignore any client-supplied price).
  const admin = createAdminClient()
  const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[]
  const { data: products } = await admin.from('products').select('id, price').in('id', ids)
  const priceById = new Map((products || []).map((p: { id: string; price: number }) => [p.id, Number(p.price)]))

  let subtotal = 0
  for (const it of items) {
    const price = it.product_id ? priceById.get(it.product_id) : undefined
    if (price == null || !Number.isFinite(price)) {
      return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 400 })
    }
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)))
    subtotal += price * qty
  }
  const shipping = subtotal >= 999 ? 0 : 99
  const amount = subtotal + shipping
  if (amount <= 0) return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })

  try {
    // Dynamically import Razorpay to avoid build errors if key not set
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    })
    return NextResponse.json({ orderId: order.id, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount })
  } catch {
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 })
  }
}
