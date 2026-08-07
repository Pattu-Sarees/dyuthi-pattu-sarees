import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CUSTOMER_REVIEW_SOURCES } from '@/types'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'

// GET /api/reviews?order_id=…      → { exists }  (has this order been reviewed?)
// GET /api/reviews?product_id=…    → { reviews } (approved reviews for a product)
export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const orderId = req.nextUrl.searchParams.get('order_id')
  const productId = req.nextUrl.searchParams.get('product_id')

  if (orderId) {
    const { data } = await admin.from('testimonials').select('id').eq('order_id', orderId).limit(1)
    return NextResponse.json({ exists: !!data?.length })
  }
  if (productId) {
    const { data } = await admin
      .from('testimonials')
      .select('id, customer_name, rating, review_title, review_text, review_images, is_verified_buyer, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ reviews: data || [] })
  }
  return NextResponse.json({ error: 'order_id or product_id required' }, { status: 400 })
}

// POST /api/reviews — customer review submission (order page, product page, review link).
// Always lands as status='pending' / is_active=false → admin approval required.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`review:${clientIp(req)}`, 5, 10 * 60_000) // 5 per 10 min
  if (!rl.ok) return tooMany(rl.retryAfter)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const customer_name = String(body.customer_name || '').trim()
  const review_text = String(body.review_text || '').trim()
  const review_title = body.review_title ? String(body.review_title).trim().slice(0, 120) : null
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 0))
  const order_id = body.order_id ? String(body.order_id) : null
  let product_id = body.product_id ? String(body.product_id) : null
  const source = (CUSTOMER_REVIEW_SOURCES as readonly string[]).includes(body.source as string)
    ? (body.source as string)
    : 'Product Page'
  const review_images = (Array.isArray(body.review_images) ? body.review_images : [])
    .filter((u: unknown): u is string => typeof u === 'string' && u.startsWith('http'))
    .slice(0, 3)

  if (!customer_name) return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
  if (!review_text) return NextResponse.json({ error: 'Please write your review' }, { status: 400 })
  if (!Number(body.rating)) return NextResponse.json({ error: 'Please select a rating' }, { status: 400 })
  if (customer_name.length > 80 || review_text.length > 2000) {
    return NextResponse.json({ error: 'Review is too long' }, { status: 400 })
  }

  const admin = createAdminClient()
  let is_verified_buyer = false
  let purchased_product: string | null = null

  if (order_id) {
    // Order-linked review: order must exist, be delivered, and not already reviewed.
    const { data: order } = await admin
      .from('orders')
      .select('id, status, customer_name, order_items(product_id, product_name)')
      .eq('id', order_id)
      .single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Reviews can be added once the order is delivered' }, { status: 400 })
    }
    const { data: existing } = await admin.from('testimonials').select('id').eq('order_id', order_id).limit(1)
    if (existing?.length) {
      return NextResponse.json({ error: 'A review has already been submitted for this order' }, { status: 409 })
    }
    is_verified_buyer = true
    const items = (order.order_items || []) as { product_id: string | null; product_name: string | null }[]
    // Prefer the product the customer picked; else the first item on the order.
    const match = product_id ? items.find((i) => i.product_id === product_id) : items[0]
    if (match) {
      product_id = match.product_id || product_id
      purchased_product = match.product_name
    }
  } else if (product_id) {
    // Product-page review: verified only if the signed-in customer has a delivered order with this product.
    const { data: product } = await admin.from('products').select('id, name').eq('id', product_id).single()
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    purchased_product = product.name

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: delivered } = await admin
        .from('orders')
        .select('id, order_items!inner(product_id)')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .eq('order_items.product_id', product_id)
        .limit(1)
      is_verified_buyer = !!delivered?.length
    }
  } else {
    return NextResponse.json({ error: 'A product or order reference is required' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('testimonials')
    .insert({
      customer_name,
      customer_email: body.customer_email ? String(body.customer_email).trim().slice(0, 120) : null,
      customer_mobile: body.customer_mobile ? String(body.customer_mobile).trim().slice(0, 20) : null,
      review_title,
      review_text,
      rating,
      order_id,
      product_id,
      purchased_product,
      review_source: source,
      review_images,
      is_verified_buyer,
      is_featured: false,
      status: 'pending',
      is_active: false, // hidden until approved
      display_order: 999,
    })
    .select('id')
    .single()

  if (error) {
    // Unique index race: someone reviewed this order in parallel
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A review has already been submitted for this order' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not save your review. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    id: data.id,
    message: 'Thank you for sharing your experience. Your review will be published after approval.',
  })
}
