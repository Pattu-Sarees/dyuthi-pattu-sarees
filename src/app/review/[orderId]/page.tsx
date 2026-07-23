import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import ReviewForm from '@/components/reviews/ReviewForm'
import { CheckCircle2, PackageX } from 'lucide-react'

export const metadata = {
  title: 'Leave a Review | Dyuthi Pattu Sarees',
  robots: { index: false, follow: false },
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFDF7] min-h-[60vh]">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-xl">{children}</div>
    </div>
  )
}

export default async function ReviewLinkPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, status, customer_name, address, order_items(product_id, product_name, product_image)')
    .eq('id', orderId)
    .single()

  if (!order) {
    return (
      <Shell>
        <div className="text-center py-16">
          <PackageX className="mx-auto h-10 w-10 text-gray-300" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Review link not valid</h1>
          <p className="mt-2 text-sm text-gray-500">We couldn&apos;t find this order. Please check the link or contact us.</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-6 py-2.5 rounded-full text-sm">Back to store</Link>
        </div>
      </Shell>
    )
  }

  if (order.status !== 'delivered') {
    return (
      <Shell>
        <div className="text-center py-16">
          <h1 className="text-xl font-bold text-gray-900">Almost there!</h1>
          <p className="mt-2 text-sm text-gray-500">Reviews can be added once your order is delivered. Please check back after delivery.</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-6 py-2.5 rounded-full text-sm">Back to store</Link>
        </div>
      </Shell>
    )
  }

  const { data: existing } = await admin.from('testimonials').select('id').eq('order_id', orderId).limit(1)
  if (existing?.length) {
    return (
      <Shell>
        <div className="text-center py-16">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Review already submitted</h1>
          <p className="mt-2 text-sm text-gray-500">Thank you — a review for this order has already been shared. It will appear on the site once approved.</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-6 py-2.5 rounded-full text-sm">Back to store</Link>
        </div>
      </Shell>
    )
  }

  const address = order.address as { name?: string } | null
  const customerName = order.customer_name || address?.name || ''
  const items = (order.order_items || []) as { product_id: string | null; product_name: string | null; product_image: string | null }[]

  return (
    <Shell>
      <div className="text-center mb-8">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-[#B8860B] mb-2">Your order was delivered</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
          We&apos;d love to hear your experience
        </h1>
      </div>

      {items.length > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-[#EFE6D4] p-3 mb-6">
          {items[0].product_image && (
            <div className="relative h-14 w-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={items[0].product_image} alt={items[0].product_name || 'Saree'} fill className="object-cover" sizes="48px" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-[#A88C57]">Your purchase</p>
            <p className="text-sm font-semibold text-[#5A4038] truncate">
              {items.map((i) => i.product_name).filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EFE6D4] p-6 shadow-sm">
        <ReviewForm
          source="Delivery Follow-up"
          orderId={order.id}
          defaultName={customerName}
        />
      </div>
    </Shell>
  )
}
