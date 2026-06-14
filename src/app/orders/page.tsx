'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Order } from '@/types'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { Package, ChevronRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then(({ orders }) => { setOrders(orders || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-8">You haven't placed any orders yet</p>
        <Link href="/products"><Button size="lg">Start Shopping</Button></Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
                {order.items?.slice(0, 4).map((item) => (
                  <div key={item.id} className="relative flex-shrink-0 w-14 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {item.product_image ? (
                      <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="56px" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xl">🥻</div>}
                  </div>
                ))}
                {order.items?.length > 4 && (
                  <div className="flex-shrink-0 w-14 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{formatDate(order.created_at)}</span>
                <span className="font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
