import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Public: persist a snapshot of the shopper's selected cart items and return
// a short share code (URL: /cart/share/<code>). Mirrors /api/wishlist/share.
//
// Two link models:
//  • Logged-in owner  -> one STABLE link per user (user_id unique). Re-sharing
//    updates the same row's items, so the link always reflects their latest selection.
//  • Anonymous        -> DEDUPE by content: identical item sets reuse the same
//    code (items_hash unique), so repeat clicks don't mint new rows/links.

export interface SharedCartItem {
  product_id: string
  image: string
  quantity: number
}

function makeCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// Order-independent hash of the item set (incl. quantity).
function hashItems(items: SharedCartItem[]) {
  const normalized = [...items]
    .map((i) => `${i.product_id}::${i.image}::${i.quantity}`)
    .sort()
    .join('\n')
  return createHash('sha256').update(normalized).digest('hex')
}

function sanitizeItems(input: unknown): SharedCartItem[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      product_id: typeof x.product_id === 'string' ? x.product_id : '',
      image: typeof x.image === 'string' ? x.image : '',
      quantity: typeof x.quantity === 'number' && x.quantity > 0 ? Math.floor(x.quantity) : 1,
    }))
    .filter((i) => i.product_id)
    .slice(0, 200)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const items = sanitizeItems(body.items)
  const ownerName: string = typeof body.ownerName === 'string' && body.ownerName.trim() ? body.ownerName.trim().slice(0, 60) : 'My'
  const userId: string | null = typeof body.userId === 'string' && body.userId ? body.userId : null

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items selected' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ---- Logged-in: stable link per user (upsert same row) ----
  if (userId) {
    const { data: existing } = await admin
      .from('shared_carts')
      .select('code')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.code) {
      await admin
        .from('shared_carts')
        .update({ items, owner_name: ownerName, updated_at: new Date().toISOString() })
        .eq('code', existing.code)
      return NextResponse.json({ code: existing.code })
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = makeCode()
      const { error } = await admin
        .from('shared_carts')
        .insert({ code, owner_name: ownerName, items, user_id: userId })
      if (!error) return NextResponse.json({ code })
      if (error.code !== '23505') return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
      const { data: raced } = await admin.from('shared_carts').select('code').eq('user_id', userId).maybeSingle()
      if (raced?.code) return NextResponse.json({ code: raced.code })
    }
    return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
  }

  // ---- Anonymous: dedupe by content hash ----
  const itemsHash = hashItems(items)
  const { data: existing } = await admin
    .from('shared_carts')
    .select('code')
    .is('user_id', null)
    .eq('items_hash', itemsHash)
    .maybeSingle()
  if (existing?.code) return NextResponse.json({ code: existing.code })

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode()
    const { error } = await admin
      .from('shared_carts')
      .insert({ code, owner_name: ownerName, items, items_hash: itemsHash })
    if (!error) return NextResponse.json({ code })
    if (error.code !== '23505') return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
    const { data: raced } = await admin
      .from('shared_carts')
      .select('code')
      .is('user_id', null)
      .eq('items_hash', itemsHash)
      .maybeSingle()
    if (raced?.code) return NextResponse.json({ code: raced.code })
  }
  return NextResponse.json({ error: 'Could not create share link' }, { status: 500 })
}
