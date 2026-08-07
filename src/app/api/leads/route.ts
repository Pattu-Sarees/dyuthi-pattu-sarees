import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notify } from '@/lib/notify-server'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const rl = rateLimit(`leads:${clientIp(req)}`, 5, 10 * 60_000) // 5 per 10 min
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await req.json()
  const { name, email, phone, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('leads').insert({
    name,
    email,
    phone: phone || null,
    message: message || null,
  })

  if (error) return NextResponse.json({ error: 'Could not submit. Please try again.' }, { status: 500 })

  await notify(admin, {
    type: 'new_lead',
    title: `New lead — ${name}`,
    body: message ? String(message).slice(0, 80) : (email || phone || null),
    link: '/admin/leads',
  })
  return NextResponse.json({ success: true })
}
