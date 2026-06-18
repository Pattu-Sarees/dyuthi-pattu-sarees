import PageBanner from '@/components/layout/PageBanner'
import ProductsGrid from '@/components/products/ProductsGrid'

export const metadata = { title: 'Best Sellers | Dyuthi Pattu Sarees' }

export default function BestSellersPage() {
  return (
    <div className="bg-white min-h-screen">
      <PageBanner title="Best Sellers" subtitle="Our most loved sarees, handpicked by our customers." />
      <div className="container mx-auto px-4 py-10">
        <ProductsGrid searchParams={Promise.resolve({ sort: 'popular' })} />
      </div>
    </div>
  )
}
