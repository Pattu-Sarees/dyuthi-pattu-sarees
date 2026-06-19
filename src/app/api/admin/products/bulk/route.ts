import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const images: string[] = Array.isArray(body.images) ? body.images : []
  if (images.length === 0) {
    return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
  }
  if (!body.price || !body.category) {
    return NextResponse.json({ error: 'Price and category are required' }, { status: 400 })
  }

  const baseName = (body.baseName || 'Saree').trim()
  const qty = Number(body.stock_quantity) || 1

  const rows = images.map((img, i) => ({
    name: images.length > 1 ? `${baseName} ${i + 1}` : baseName,
    description: body.description || '',
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    images: [img],
    category: body.category,
    fabric: body.fabric || '',
    color: [],
    occasion: body.occasion || [],
    region: body.region || '',
    in_stock: true,
    stock_quantity: qty,
    is_featured: body.is_featured ?? false,
    is_new_arrival: body.is_new_arrival ?? false,
  }))

  const admin = createAdminClient()
  const { data, error } = await admin.from('products').insert(rows).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ created: data?.length || 0 })
}
