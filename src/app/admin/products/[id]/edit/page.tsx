import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ProductForm from '@/components/admin/ProductForm'
import { Product } from '@/types'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('*').eq('id', id).single()

  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Saree</h1>
      <p className="text-sm text-gray-500 mb-6">Update details or photos</p>
      <ProductForm product={product as Product} />
    </div>
  )
}
