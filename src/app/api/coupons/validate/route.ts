import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateCoupon } from '@/lib/coupon'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'

// Checkout coupon preview. Validates a code against the cart and returns the
// server-computed discount. This is preview only — the real discount is
// recomputed and the counters incremented at order creation.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`coupon:${clientIp(req)}`, 20, 10 * 60_000) // 20 tries / 10 min (anti-enumeration)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ valid: false, error_code: 'COUPON_LOGIN_REQUIRED', message: 'Please sign in to use a coupon' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  // Only one coupon per order — never accept an array / multiple codes.
  if (Array.isArray(body.code)) {
    return NextResponse.json({ valid: false, error_code: 'COUPON_SINGLE_ONLY', message: 'Only one coupon can be applied per order.' }, { status: 400 })
  }
  // Preview only — use the cart subtotal for display. The authoritative discount
  // is recomputed from real DB prices at /api/payment/create-order and /api/orders,
  // so a tampered preview subtotal can never change what the customer is charged.
  const subtotal = Math.max(0, Math.round(Number(body.subtotal) || 0))
  if (subtotal <= 0) return NextResponse.json({ valid: false, error_code: 'CART_INVALID', message: 'Your cart is empty' }, { status: 400 })

  const admin = createAdminClient()
  const res = await evaluateCoupon(admin, String(body.code || ''), subtotal, { userId: user.id })
  if (!res.ok) {
    return NextResponse.json({ valid: false, error_code: res.code, message: res.message })
  }
  return NextResponse.json({
    valid: true,
    code: res.code,
    description: res.description,
    subtotal: res.subtotal,
    discount: res.discount,
  })
}
