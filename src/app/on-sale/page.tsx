import PageBanner from '@/components/layout/PageBanner'
import ProductsGrid from '@/components/products/ProductsGrid'

export const metadata = { title: 'On Sale | Dyuthi Pattu Sarees' }

export default function OnSalePage() {
  return (
    <div className="bg-white min-h-screen">
      <PageBanner title="On Sale" subtitle="Exclusive savings on premium handloom sarees." />
      <div className="container mx-auto px-4 py-10">
        <ProductsGrid searchParams={Promise.resolve({ on_sale: 'true' })} />
      </div>
    </div>
  )
}
