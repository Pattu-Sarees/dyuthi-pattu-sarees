import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// All wishlist-collection writes go through this route (server-side, service
// role) instead of the browser hitting Supabase REST directly. Ownership is
// always enforced with user_id = the authenticated user, so a user can only
// touch their own collections — and direct REST writes are removed entirely.

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const cleanItems = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 500) : []

// GET — list the current user's collections
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wishlist_collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load collections' }, { status: 500 })
  return NextResponse.json({ collections: data || [] })
}

// POST — create a collection for the current user
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = clean(body.name, 120)
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wishlist_collections')
    .insert({ user_id: user.id, name, items: cleanItems(body.items), cover: clean(body.cover, 500) || null })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: 'Could not create collection' }, { status: 500 })
  return NextResponse.json({ collection: data })
}

// PATCH — rename / update items of one of the user's own collections
export async function PATCH(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = clean(body.id, 100)
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = clean(body.name, 120)
  if (body.items !== undefined) patch.items = cleanItems(body.items)
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('wishlist_collections')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id) // ownership guard (service role bypasses RLS)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: 'Could not update collection' }, { status: 500 })
  return NextResponse.json({ collection: data })
}

// DELETE — remove one of the user's own collections
export async function DELETE(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = clean(new URL(req.url).searchParams.get('id') || (await req.json().catch(() => ({}))).id, 100)
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin
    .from('wishlist_collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Could not delete collection' }, { status: 500 })
  return NextResponse.json({ success: true })
}
