import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

// Tells the login UI whether this admin already has a password set, so it can
// show "Create Password" (first time) vs "Enter Password".
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const mail = (email || '').trim()
  if (!isAdminEmail(mail)) return NextResponse.json({ isAdmin: false, hasPassword: false })

  const admin = createAdminClient()
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const user = list?.users?.find((u) => u.email?.toLowerCase() === mail.toLowerCase())
  const hasPassword = user?.user_metadata?.has_password === true
  return NextResponse.json({ isAdmin: true, hasPassword })
}
