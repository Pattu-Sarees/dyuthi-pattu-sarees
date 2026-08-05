import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { logActivity } from '@/lib/notify-server'
import { sanitizeProcurements } from '@/lib/procurement'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  const variants = (Array.isArray(body.color_variants) ? body.color_variants : [])
    .map((v: { image?: string; quantity?: number; color?: string; is_new_arrival?: boolean; is_best_seller?: boolean; additional_images?: string[] }) => ({
      image: v.image,
      quantity: Number(v.quantity) || 0,
      color: typeof v.color === 'string' ? v.color.trim() : '',
      is_new_arrival: !!v.is_new_arrival,
      is_best_seller: !!v.is_best_seller,
      additional_images: Array.isArray(v.additional_images) ? v.additional_images.filter((u) => typeof u === 'string') : [],
    }))
  // Product-level colour list = the distinct colours across variants.
  const variantColors = Array.from(new Set(variants.map((v: { color?: string }) => v.color).filter(Boolean)))
  const stockFromVariants = variants.reduce((s: number, v: { quantity: number }) => s + (Number(v.quantity) || 0), 0)
  // Product-level flags are a rollup of the per-item flags.
  const anyNewArrival = variants.some((v: { is_new_arrival?: boolean }) => !!v.is_new_arrival)
  const anyBestSeller = variants.some((v: { is_best_seller?: boolean }) => !!v.is_best_seller)
  const payload = {
    name: body.name,
    description: body.description || '',
    code: body.code ? String(body.code).trim() : null,
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    priority: body.priority != null && body.priority !== '' ? Number(body.priority) : null,
    images: body.images || [],
    category: body.category,
    fabric: body.fabric || '',
    color: variantColors.length ? variantColors : (body.color || []),
    color_variants: variants,
    occasion: body.occasion || [],
    region: body.region || '',
    in_stock: (variants.length ? stockFromVariants : Number(body.stock_quantity) || 0) > 0,
    stock_quantity: variants.length ? stockFromVariants : Number(body.stock_quantity) || 1,
    is_featured: false,
    is_new_arrival: anyNewArrival,
    is_best_seller: anyBestSeller,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    slug: (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    // Procurement (per-vendor records + backward-compatible flat fields)
    procurements: sanitizeProcurements(body.procurements),
    vendor_ids: Array.isArray(body.vendor_ids) ? body.vendor_ids.filter((v: unknown) => typeof v === 'string') : [],
    vendor_id: (Array.isArray(body.vendor_ids) && body.vendor_ids[0]) || body.vendor_id || null,
    purchase_cost: body.purchase_cost != null && body.purchase_cost !== '' ? Number(body.purchase_cost) : null,
    purchase_date: body.purchase_date || null,
    invoice_number: body.invoice_number || null,
    procurement_notes: body.procurement_notes || null,
    video_urls: Array.isArray(body.video_urls) ? body.video_urls.filter((u: unknown) => typeof u === 'string' && u.trim()).map((u: string) => u.trim()) : [],
    video_url: (Array.isArray(body.video_urls) && body.video_urls.find((u: unknown) => typeof u === 'string' && u.trim())?.trim()) || body.video_url || null,
    video_watermark: body.video_watermark || null,
  }

  if (!payload.name || !payload.price || !payload.category) {
    return NextResponse.json({ error: 'Name, price and category are required' }, { status: 400 })
  }

  const { data, error } = await admin.from('products').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logActivity(admin, { adminEmail: user.email ?? null, action: 'product_created', entity: 'product', entityId: data.id, detail: data.name })
  revalidateTag('products') // refresh the storefront cache immediately
  return NextResponse.json({ product: data })
}
