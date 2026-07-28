import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

// GET: the shared custom-colour palette.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('custom_colors').select('name, hex').order('created_at', { ascending: true })
  if (error) return NextResponse.json({ colors: [] })
  return NextResponse.json({ colors: data || [] })
}

// POST { name, hex? }: add a custom colour (upsert by name). hex null = "✕" swatch.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : ''
  const hex = typeof body.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.hex) ? body.hex : null
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('custom_colors')
    .upsert({ name, hex }, { onConflict: 'name' })
    .select('name, hex')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ color: data })
}
