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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const menu_group = (MENU_GROUPS as readonly string[]).includes(body.menu_group) ? body.menu_group : 'Sarees'
  if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: existing } = await admin.from('product_categories').select('slug').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const newSlug = categorySlug(name)
  // If the rename changes the slug, migrate every product on the old slug so no
  // product is left pointing at a category that no longer exists.
  if (newSlug !== existing.slug) {
    const { error: mErr } = await admin.from('products').update({ category: newSlug }).eq('category', existing.slug)
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  }

  const { data, error } = await admin
    .from('product_categories')
    .update({ name, slug: newSlug, description: description || null, menu_group, updated_at: new Date().toISOString() })
    .eq('id', id)
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: existing } = await admin.from('product_categories').select('slug').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  // Block deletion while products still use it — otherwise those products would
  // point at a missing category (the exact glitch we just fixed).
  const { count } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category', existing.slug)
  if (count && count > 0) {
    return NextResponse.json(
      { error: `${count} product${count === 1 ? '' : 's'} still use this category. Reassign them first, then delete.` },
      { status: 409 }
    )
  }

  const { error } = await admin.from('product_categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('products', 'max')
  return NextResponse.json({ success: true })
}
