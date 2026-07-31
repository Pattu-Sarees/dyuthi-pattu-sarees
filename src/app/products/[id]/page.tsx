import { notFound } from 'next/navigation'
import ProductDetail from '@/components/products/ProductDetail'
import { getProductPage } from '@/lib/storefront-data'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Cached (anon) read of product + approved reviews — fast repeat navigations.
  const { product, reviews } = await getProductPage(id)
  if (!product) notFound()
  return <ProductDetail product={product} reviews={reviews} />
}
