import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('categories').select('*').order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ categories: [], error: error.message })
  return NextResponse.json({ categories: data })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.name || !body.slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('categories').insert({
    name: body.name,
    slug: String(body.slug).trim().toLowerCase(),
    image: body.image || '',
    sort_order: Number(body.sort_order) || 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}
