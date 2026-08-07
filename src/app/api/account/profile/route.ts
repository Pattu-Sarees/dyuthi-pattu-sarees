import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Profile updates go through the server (service role) — the browser no longer
// writes to the `profiles` table directly. A user can only update their OWN
// profile (id is taken from the authenticated session, never from the client).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 20) : ''

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').upsert({
    id: user.id, // always the signed-in user — never client-supplied
    full_name,
    phone,
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: 'Could not save profile' }, { status: 500 })
  return NextResponse.json({ success: true })
}
