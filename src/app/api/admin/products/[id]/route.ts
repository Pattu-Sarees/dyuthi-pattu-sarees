import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { logActivity } from '@/lib/notify-server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  // Stock is owned by the Inventory module (logged adjustments only). On edit we
  // keep each EXISTING colour's stored quantity, but allow a brand-new colour row
  // to set its first-time pieces. Only the resulting delta (new colours added −
  // existing colours removed) is applied to the Inventory-owned running total, so
  // separate Inventory adjustments are never clobbered.
  const { data: existing } = await admin
    .from('products')
    .select('stock_quantity, in_stock, color_variants')
    .eq('id', id)
    .single()

  const dbQtyByImage = new Map<string, number>(
    (Array.isArray(existing?.color_variants) ? existing!.color_variants : [])
      .filter((v: { image?: string }) => v.image)
      .map((v: { image: string; quantity?: number }) => [v.image, Number(v.quantity) || 0])
  )
  const incoming = Array.isArray(body.color_variants) ? body.color_variants : []
  // Existing images keep their stored quantity; new images take the submitted one.
  const variants = incoming
    .filter((v: { image?: string }) => v.image)
    .map((v: { image: string; quantity?: number; color?: string; is_new_arrival?: boolean; is_best_seller?: boolean; additional_images?: string[] }) => ({
      image: v.image,
      quantity: dbQtyByImage.has(v.image) ? dbQtyByImage.get(v.image)! : Math.max(0, Number(v.quantity) || 0),
      color: typeof v.color === 'string' ? v.color.trim() : '',
      is_new_arrival: !!v.is_new_arrival,
      is_best_seller: !!v.is_best_seller,
      additional_images: Array.isArray(v.additional_images) ? v.additional_images.filter((u) => typeof u === 'string') : [],
    }))

  const submittedImages = new Set(variants.map((v: { image: string }) => v.image))
  const addedQty = variants
    .filter((v: { image: string }) => !dbQtyByImage.has(v.image))
    .reduce((s: number, v: { quantity: number }) => s + v.quantity, 0)
  const removedQty = [...dbQtyByImage.entries()]
    .filter(([img]) => !submittedImages.has(img))
    .reduce((s, [, q]) => s + q, 0)

  const currentStock = Number(existing?.stock_quantity ?? 0)
  const newStock = Math.max(0, currentStock - removedQty + addedQty)

  const variantColors = Array.from(new Set(variants.map((v: { color?: string }) => v.color).filter(Boolean)))
  const payload = {
    name: body.name,
    description: body.description || '',
    code: body.code ? String(body.code).trim() : null,
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    images: body.images || [],
    category: body.category,
    fabric: body.fabric || '',
    color: variantColors.length ? variantColors : (body.color || []),
    color_variants: variants,
    occasion: body.occasion || [],
    region: body.region || '',
    in_stock: newStock > 0,
    stock_quantity: newStock,
    is_featured: false,
    is_new_arrival: variants.some((v: { is_new_arrival?: boolean }) => !!v.is_new_arrival),
    is_best_seller: variants.some((v: { is_best_seller?: boolean }) => !!v.is_best_seller),
    ...(body.status === 'active' || body.status === 'inactive' ? { status: body.status } : {}),
    // Procurement
    vendor_id: body.vendor_id || null,
    purchase_cost: body.purchase_cost != null && body.purchase_cost !== '' ? Number(body.purchase_cost) : null,
    purchase_date: body.purchase_date || null,
    invoice_number: body.invoice_number || null,
    procurement_notes: body.procurement_notes || null,
    video_url: body.video_url || null,
    video_watermark: body.video_watermark || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin.from('products').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log the stock delta to the Inventory audit trail (best-effort).
  if (newStock !== currentStock) {
    await admin.from('stock_movements').insert({
      product_id: id,
      change: newStock - currentStock,
      resulting_quantity: newStock,
      reason: 'correction',
      note: addedQty && !removedQty ? 'New colour added via product edit'
        : removedQty && !addedQty ? 'Colour removed via product edit'
        : 'Colour change via product edit',
      created_by: user.email,
    }).then(undefined, () => {})
  }

  await logActivity(admin, { adminEmail: user.email ?? null, action: 'product_updated', entity: 'product', entityId: id, detail: data.name })
  return NextResponse.json({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (body.status === 'active' || body.status === 'inactive') patch.status = body.status
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
