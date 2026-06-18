import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Add New Saree</h1>
      <p className="text-sm text-gray-500 mb-6">Fill in the details and upload photos</p>
      <ProductForm />
    </div>
  )
}
