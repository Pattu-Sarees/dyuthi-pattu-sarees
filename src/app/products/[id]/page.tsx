import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/products/ProductDetail'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS, PUBLIC_PRODUCT_VIDEO_COLUMNS, PUBLIC_PRODUCT_DETAIL_COLUMNS } from '@/lib/public-product-columns'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Try richest column set first, then gracefully degrade if a newer column
  // (video_watermark, then video_url) doesn't exist yet — so the page always renders.
  let product: Product | null = null
  for (const cols of [PUBLIC_PRODUCT_DETAIL_COLUMNS, PUBLIC_PRODUCT_VIDEO_COLUMNS, PUBLIC_PRODUCT_COLUMNS]) {
    const { data } = await supabase.from('products').select(cols).eq('id', id).single()
    if (data) { product = data as unknown as Product; break }
  }

  if (!product) notFound()

  // Approved reviews for this product (unified review store = testimonials table)
  const { data } = await supabase
    .from('testimonials')
    .select('id, customer_name, rating, review_title, review_text, review_images, is_verified_buyer, created_at')
    .eq('product_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = (data || []).map((r) => ({
    id: r.id as string,
    user_name: r.customer_name as string,
    rating: r.rating as number,
    title: (r.review_title as string) || null,
    comment: r.review_text as string,
    images: (r.review_images as string[]) || [],
    verified: !!r.is_verified_buyer,
    created_at: r.created_at as string,
  }))

  return <ProductDetail product={product} reviews={reviews} />
}
