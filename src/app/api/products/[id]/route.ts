import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const { data: reviews } = await supabase
    .from('testimonials')
    .select('id, customer_name, rating, review_title, review_text, review_images, is_verified_buyer, created_at')
    .eq('product_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ product, reviews: reviews || [] })
}
