import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public list of currently-usable coupons to show customers at checkout.
// Only advertises code + description + headline discount — never usage limits
// or targeting rules. Eligibility is still fully checked on apply.
export async function GET() {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await admin
    .from('coupons')
    .select('code, description, discount_type, discount_value, min_order_value')
    .eq('is_active', true)
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ coupons: data || [] })
}
