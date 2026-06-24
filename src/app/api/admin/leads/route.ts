import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { count, data, error } = await admin
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // If the leads table doesn't exist yet, return 0 gracefully
  if (error) return NextResponse.json({ count: 0, leads: [] })

  return NextResponse.json({ count: count || 0, leads: data || [] })
}
