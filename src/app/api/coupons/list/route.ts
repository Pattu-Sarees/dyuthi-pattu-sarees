import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Public list of currently-usable coupons to show customers at checkout.
// Only advertises code + description + headline discount — never usage limits
// or targeting rules. Cached 60s so it loads instantly and is light on the DB.
const getOffers = unstable_cache(
  async () => {
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await admin
      .from('coupons')
      .select('code, description, discount_type, discount_value, min_order_value')
      .eq('is_active', true)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)
      .order('created_at', { ascending: false })
      .limit(20)
    return data || []
  },
  ['coupon-offers'],
  { revalidate: 60, tags: ['coupons'] },
)

export async function GET() {
  const coupons = await getOffers()
  return NextResponse.json({ coupons })
}
