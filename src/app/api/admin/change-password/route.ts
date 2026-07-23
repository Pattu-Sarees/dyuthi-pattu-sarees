import { NextRequest, NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { isValidPassword, PASSWORD_RULES_MSG } from '@/lib/password'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

  // Verify the current password (throwaway client — no session persisted).
  const js = createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: signErr } = await js.auth.signInWithPassword({ email: user.email!, password: currentPassword })
  if (signErr) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  if (!isValidPassword(newPassword)) return NextResponse.json({ error: PASSWORD_RULES_MSG }, { status: 400 })
  if (newPassword === currentPassword) return NextResponse.json({ error: 'New password must be different from the current password' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword, user_metadata: { ...user.user_metadata, has_password: true } })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
