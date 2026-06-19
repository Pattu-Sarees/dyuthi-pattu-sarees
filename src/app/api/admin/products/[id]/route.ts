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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  const variants = Array.isArray(body.color_variants) ? body.color_variants : []
  const stockFromVariants = variants.reduce((s: number, v: { quantity: number }) => s + (Number(v.quantity) || 0), 0)
  const payload = {
    name: body.name,
    description: body.description || '',
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    images: body.images || [],
    category: body.category,
    fabric: body.fabric || '',
    color: body.color || [],
    color_variants: variants,
    occasion: body.occasion || [],
    region: body.region || '',
    in_stock: (variants.length ? stockFromVariants : Number(body.stock_quantity) || 0) > 0,
    stock_quantity: variants.length ? stockFromVariants : Number(body.stock_quantity) || 1,
    is_featured: body.is_featured ?? false,
    is_new_arrival: body.is_new_arrival ?? false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin.from('products').update(payload).eq('id', id).select().single()
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
