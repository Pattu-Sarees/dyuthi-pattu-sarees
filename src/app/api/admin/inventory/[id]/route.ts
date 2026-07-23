import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { STOCK_REASONS } from '@/types'
import { deriveVariants } from '@/lib/inventory'
import { notify, logActivity } from '@/lib/notify-server'
import { getLowStockThreshold } from '@/lib/settings'

async function getAdminEmail() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && isAdminEmail(user.email)) return user.email ?? null
  return undefined
}

// GET: movement history for one product
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if ((await getAdminEmail()) === undefined) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('stock_movements')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ movements: [] })
  return NextResponse.json({ movements: data || [] })
}

function targetQty(mode: string, amount: number, current: number): number {
  if (mode === 'add') return current + Math.round(amount)
  if (mode === 'subtract') return Math.max(0, current - Math.round(amount))
  return Math.max(0, Math.round(amount)) // 'set'
}

// POST: adjust stock for a colour (variantImage) or the whole product.
// body { variantImage?, mode: 'set'|'add'|'subtract', amount, reason, note }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail()
  if (email === undefined) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'Amount must be a non-negative number' }, { status: 400 })
  }
  const mode = ['set', 'add', 'subtract'].includes(body.mode) ? body.mode : 'set'
  const reason = STOCK_REASONS.includes(body.reason) ? body.reason : 'adjustment'
  const note = body.note?.trim() || null
  const variantImage: string | null = typeof body.variantImage === 'string' ? body.variantImage : null

  const admin = createAdminClient()

  const { data: product, error: pErr } = await admin
    .from('products')
    .select('name, stock_quantity, in_stock, color_variants, images')
    .eq('id', id)
    .single()
  if (pErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Log the adjustment + raise a low-stock notification when a level drops low
  // (using the admin's configured Low Stock Threshold from Settings).
  const lowThreshold = await getLowStockThreshold()
  const afterAdjust = async (level: number) => {
    await logActivity(admin, { adminEmail: email, action: 'inventory_adjusted', entity: 'inventory', entityId: id, detail: `${product.name}: ${reason}${note ? ` — ${note}` : ''}` })
    if (level <= 0) await notify(admin, { type: 'low_stock', title: `Out of stock — ${product.name}`, body: 'A colour/item has sold out', link: '/admin/inventory' })
    else if (level <= lowThreshold) await notify(admin, { type: 'low_stock', title: `Low stock — ${product.name}`, body: `Only ${level} left`, link: '/admin/inventory' })
  }

  // Derive the per-colour breakdown (self-heals older products that have images
  // but no stored color_variants — first image carries the existing stock).
  const variants = deriveVariants(product.color_variants, product.images, product.stock_quantity ?? 0)

  // ---- Per-colour path ----
  if (variantImage) {
    const idx = variants.findIndex((v: { image: string }) => v.image === variantImage)
    if (idx === -1) return NextResponse.json({ error: 'Colour not found on this product' }, { status: 404 })

    const oldQ = variants[idx].quantity
    const newQ = targetQty(mode, amount, oldQ)
    const delta = newQ - oldQ
    variants[idx] = { ...variants[idx], quantity: newQ }
    const newTotal = variants.reduce((s: number, v: { quantity: number }) => s + v.quantity, 0)

    const { error: uErr } = await admin
      .from('products')
      .update({ color_variants: variants, stock_quantity: newTotal, in_stock: newTotal > 0, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

    if (delta !== 0) {
      await admin.from('stock_movements').insert({
        product_id: id, change: delta, resulting_quantity: newTotal,
        reason, note, variant_image: variantImage, created_by: email,
      }).then(undefined, () => {})
      await afterAdjust(newQ)
    }

    return NextResponse.json({ stock_quantity: newTotal, in_stock: newTotal > 0, variantImage, variantQty: newQ, unchanged: delta === 0 })
  }

  // ---- Whole-product path (products without colour variants) ----
  const current = product.stock_quantity ?? 0
  const newTotal = targetQty(mode, amount, current)
  const delta = newTotal - current
  if (delta === 0) {
    return NextResponse.json({ stock_quantity: current, in_stock: !!product.in_stock, unchanged: true })
  }
  const { data: newQty, error } = await admin.rpc('adjust_stock', {
    pid: id, delta, p_reason: reason, p_note: note, p_by: email,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await afterAdjust(newQty as number)
  return NextResponse.json({ stock_quantity: newQty, in_stock: (newQty as number) > 0 })
}
