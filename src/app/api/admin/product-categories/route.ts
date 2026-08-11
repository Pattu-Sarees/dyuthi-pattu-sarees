import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { MENU_GROUPS, categorySlug } from '@/lib/categories'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('product_categories')
    .select('id, name, slug, description, menu_group')
    .order('name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const menu_group = (MENU_GROUPS as readonly string[]).includes(body.menu_group) ? body.menu_group : 'Sarees'
  if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('product_categories')
    .insert({ name, slug: categorySlug(name), description: description || null, menu_group })
    .select()
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: `A category named "${name}" already exists.` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  revalidateTag('products', 'max')
  return NextResponse.json({ category: data })
}
