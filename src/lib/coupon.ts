import type { SupabaseClient } from '@supabase/supabase-js'

// Server-side coupon evaluation — the SINGLE source of truth used by both the
// checkout preview (/api/coupons/validate) and the real order creation, so the
// discount can never be faked from the client. Phase 1: no product/user
// restrictions yet — exists / active / date / min / max / global + daily limit.

export type CartLine = { product_id?: string; quantity?: number }

export type CouponEval =
  | { ok: true; couponId: string; code: string; description: string | null; discount: number; subtotal: number }
  | { ok: false; code: string; message: string; subtotal: number }

// Today's date in the store timezone (Asia/Kolkata) as YYYY-MM-DD.
export function istToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

// Sum line totals from REAL DB prices (never trust client prices).
export async function computeSubtotal(
  admin: SupabaseClient,
  items: CartLine[],
): Promise<{ subtotal: number; ok: boolean }> {
  const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[]
  if (ids.length === 0) return { subtotal: 0, ok: false }
  const { data } = await admin.from('products').select('id, price').in('id', ids)
  const priceById = new Map((data || []).map((p: { id: string; price: number }) => [p.id, Number(p.price)]))
  let subtotal = 0
  for (const it of items) {
    const price = it.product_id ? priceById.get(it.product_id) : undefined
    if (price == null || !Number.isFinite(price)) return { subtotal: 0, ok: false }
    subtotal += price * Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)))
  }
  return { subtotal, ok: true }
}

// Validate a coupon against a subtotal and return the discount (read-only —
// does NOT increment counters; that happens atomically at order creation).
export async function evaluateCoupon(
  admin: SupabaseClient,
  rawCode: string,
  subtotal: number,
  opts: { userId?: string | null } = {},
): Promise<CouponEval> {
  const userId = opts.userId ?? null
  const err = (code: string, message: string): CouponEval => ({ ok: false, code, message, subtotal })
  const code = (rawCode || '').trim().toUpperCase()
  if (!code) return err('COUPON_NOT_FOUND', 'Enter a coupon code')

  const { data: c } = await admin.from('coupons').select('*').ilike('code', code).maybeSingle()
  if (!c) return err('COUPON_NOT_FOUND', 'Invalid coupon code')
  if (!c.is_active) return err('COUPON_INACTIVE', 'This coupon is not active')

  if (c.expiry_date) {
    const today = new Date(new Date().toDateString())
    if (new Date(c.expiry_date) < today) return err('COUPON_EXPIRED', 'This coupon has expired')
  }
  if (c.usage_limit != null && c.used_count >= c.usage_limit) {
    return err('COUPON_LIMIT_REACHED', 'This coupon has reached its usage limit')
  }
  if (c.max_daily_uses != null) {
    const { data: d } = await admin
      .from('coupon_daily_usage')
      .select('count')
      .eq('coupon_id', c.id)
      .eq('usage_date', istToday())
      .maybeSingle()
    if (d && Number(d.count) >= c.max_daily_uses) {
      return err('COUPON_DAILY_LIMIT', "This coupon has reached today's limit")
    }
  }
  // ---- User restrictions (Phase 2) ----
  const needsUser = !!(c.new_users_only || c.existing_users_only || c.once_per_user || c.per_user_limit != null)
  if (!userId) {
    if (c.allow_guests === false || needsUser) {
      return err('COUPON_LOGIN_REQUIRED', 'Please sign in to use this coupon')
    }
  } else {
    if (c.new_users_only || c.existing_users_only) {
      const { count } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('payment_status', 'paid')
        .not('status', 'in', '(cancelled,refunded)')
      const hasPaid = (count ?? 0) > 0
      if (c.new_users_only && hasPaid) return err('COUPON_NEW_USERS_ONLY', 'This coupon is only for first-time customers')
      if (c.existing_users_only && !hasPaid) return err('COUPON_EXISTING_USERS_ONLY', 'This coupon is only for returning customers')
    }
    if (c.once_per_user || c.per_user_limit != null) {
      const { count } = await admin
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', c.id)
        .eq('user_id', userId)
        .eq('status', 'redeemed')
      const used = count ?? 0
      const limit = c.once_per_user ? 1 : Number(c.per_user_limit)
      if (used >= limit) {
        return err('COUPON_USER_LIMIT', limit === 1
          ? 'You have already used this coupon'
          : `You have already used this coupon the maximum ${limit} times`)
      }
    }
  }

  if (c.min_order_value && subtotal < Number(c.min_order_value)) {
    return err('COUPON_MIN_NOT_MET', `Add ${inr(Number(c.min_order_value) - subtotal)} more to use this coupon`)
  }
  if (c.max_order_value != null && subtotal > Number(c.max_order_value)) {
    return err('COUPON_MAX_EXCEEDED', `This coupon is only valid for orders up to ${inr(Number(c.max_order_value))}`)
  }

  const raw = c.discount_type === 'percent'
    ? Math.round((subtotal * Number(c.discount_value)) / 100)
    : Number(c.discount_value)
  const discount = Math.max(0, Math.min(Math.round(raw), subtotal)) // never exceed the subtotal

  return { ok: true, couponId: c.id, code: c.code, description: c.description ?? null, discount, subtotal }
}
