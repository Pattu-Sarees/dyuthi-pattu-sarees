import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Public: persist a snapshot of the shopper's wishlist and return a short
// share code (URL: /wishlist/share/<code>).
//
// Two link models:
//  • Logged-in owner  -> one STABLE link per user (user_id unique). Re-sharing
//    updates the same row's items, so the link always reflects their latest list.
//  • Anonymous        -> DEDUPE by content: identical item sets reuse the same
//    code (items_hash unique), so repeat clicks don't mint new rows/links.
function makeCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Order-independent hash of the item set.
function hashItems(items: string[]) {
  const normalized = [...items].sort().join('\n')
  return createHash('sha256').update(normalized).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const items: string[] = Array.isArray(body.items) ? body.items.filter((x: unknown) => typeof x === 'string').slice(0, 200) : []
  const ownerName: string = typeof body.ownerName === 'string' && body.ownerName.trim() ? body.ownerName.trim().slice(0, 60) : 'My'
  const userId: string | null = typeof body.userId === 'string' && body.userId ? body.userId : null

  if (items.length === 0) {
    return NextResponse.json({ error: 'Wishlist is empty' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ---- Logged-in: stable link per user (upsert same row) ----
  if (userId) {
    const { data: existing } = await admin
      .from('shared_wishlists')
      .select('code')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.code) {
      await admin
        .from('shared_wishlists')
        .update({ items, owner_name: ownerName, updated_at: new Date().toISOString() })
        .eq('code', existing.code)
      return NextResponse.json({ code: existing.code })
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = makeCode()
      const { error } = await admin
        .from('shared_wishlists')
        .insert({ code, owner_name: ownerName, items, user_id: userId })
      if (!error) return NextResponse.json({ code })
      if (error.code !== '23505') return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
      // 23505 could be a code collision OR a concurrent insert for this user.
      const { data: raced } = await admin.from('shared_wishlists').select('code').eq('user_id', userId).maybeSingle()
      if (raced?.code) return NextResponse.json({ code: raced.code })
    }
    return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
  }

  // ---- Anonymous: dedupe by content hash ----
  const itemsHash = hashItems(items)
  const { data: existing } = await admin
    .from('shared_wishlists')
    .select('code')
    .is('user_id', null)
    .eq('items_hash', itemsHash)
    .maybeSingle()
  if (existing?.code) return NextResponse.json({ code: existing.code })

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode()
    const { error } = await admin
      .from('shared_wishlists')
      .insert({ code, owner_name: ownerName, items, items_hash: itemsHash })
    if (!error) return NextResponse.json({ code })
    if (error.code !== '23505') return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
    // Concurrent insert of the same item set — return the winner's code.
    const { data: raced } = await admin
      .from('shared_wishlists')
      .select('code')
      .is('user_id', null)
      .eq('items_hash', itemsHash)
      .maybeSingle()
    if (raced?.code) return NextResponse.json({ code: raced.code })
  }
  return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
}
