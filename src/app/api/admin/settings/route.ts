import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { getStoreSettings } from '@/lib/settings'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ settings: await getStoreSettings() })
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobileRe = /^[0-9+\-\s()]{7,20}$/

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()

  const email = (b.business_email || '').trim()
  if (email && !emailRe.test(email)) return NextResponse.json({ error: 'Enter a valid business email' }, { status: 400 })
  const support = (b.support_mobile || '').trim()
  if (support && !mobileRe.test(support)) return NextResponse.json({ error: 'Enter a valid support mobile number' }, { status: 400 })
  const wa = (b.whatsapp_number || '').trim()
  if (wa && !mobileRe.test(wa)) return NextResponse.json({ error: 'Enter a valid WhatsApp number' }, { status: 400 })
  const threshold = Number(b.low_stock_threshold)
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) return NextResponse.json({ error: 'Low stock threshold must be a whole number (0–100)' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('store_settings').update({
    store_name: (b.store_name || '').trim() || null,
    support_mobile: support || null,
    whatsapp_number: wa || null,
    business_email: email || null,
    store_address: (b.store_address || '').trim() || null,
    low_stock_threshold: threshold,
    announcement_text: (b.announcement_text || '').trim() || null,
    hero_banner_image: (b.hero_banner_image || '').trim() || null,
    show_best_sellers: b.show_best_sellers !== false,
    show_new_arrivals: b.show_new_arrivals !== false,
    updated_at: new Date().toISOString(),
  }).eq('id', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: await getStoreSettings() })
}
