import { NextRequest, NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { isValidPassword, PASSWORD_RULES_MSG } from '@/lib/password'

// First factor of admin 2FA: confirm the email is an admin and the password is
// correct. First-time (no password set yet) → set the entered password now, so
// nobody gets locked out during the switch to 2FA. On success the client then
// sends + verifies the email OTP (second factor).
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const mail = (email || '').trim()

  if (!isAdminEmail(mail)) return NextResponse.json({ ok: false, denied: true })
  if (!password) return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const user = list?.users?.find((u) => u.email?.toLowerCase() === mail.toLowerCase())

  // No account yet → create it with this password (must meet the rules).
  if (!user) {
    if (!isValidPassword(password)) return NextResponse.json({ ok: false, error: PASSWORD_RULES_MSG }, { status: 400 })
    const { error } = await admin.auth.admin.createUser({ email: mail, password, email_confirm: true, user_metadata: { has_password: true } })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, firstTime: true })
  }

  const hasPassword = user.user_metadata?.has_password === true

  if (hasPassword) {
    // Verify without persisting a session (throwaway client, no cookies).
    const js = createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error } = await js.auth.signInWithPassword({ email: mail, password })
    if (error) return NextResponse.json({ ok: false, error: 'Incorrect password' })
    return NextResponse.json({ ok: true })
  }

  // Account exists but has no password yet → set this one (first-time).
  if (!isValidPassword(password)) return NextResponse.json({ ok: false, error: PASSWORD_RULES_MSG }, { status: 400 })
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, user_metadata: { ...user.user_metadata, has_password: true } })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, firstTime: true })
}
