import PageBanner from '@/components/layout/PageBanner'
import ProductsGrid from '@/components/products/ProductsGrid'

export const metadata = { title: 'New Arrivals | Dyuthi Pattu Sarees' }

export default function NewArrivalsPage() {
  return (
    <div className="bg-white min-h-screen">
      <PageBanner title="New Arrivals" subtitle="Fresh handloom weaves, just off the loom" />
      <div className="container mx-auto px-4 py-10">
        <ProductsGrid searchParams={Promise.resolve({ is_new_arrival: 'true' })} />
      </div>
    </div>
  )
}
