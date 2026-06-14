'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Order } from '@/types'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { Package, MapPin, CreditCard, ChevronLeft, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ORDER_STEPS = [
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then(({ order }) => { setOrder(order); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  )

  if (!order) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-gray-500">Order not found</p>
      <Link href="/orders"><Button className="mt-4">View All Orders</Button></Link>
    </div>
  )

  const currentStepIdx = ORDER_STEPS.findIndex((s) => s.status === order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'returned'

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> All Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`self-start px-3 py-1.5 text-sm font-semibold rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-6">Order Tracking</h2>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                {ORDER_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx
                  const active = idx === currentStepIdx
                  return (
                    <div key={step.status} className="relative flex items-start gap-4 mb-6 last:mb-0">
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-green-500' : 'bg-gray-100'}`}>
                        {done ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Circle className="h-5 w-5 text-gray-300" />}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${done ? (active ? 'text-green-600' : 'text-gray-900') : 'text-gray-400'}`}>{step.label}</p>
                        {active && order.estimated_delivery && (
                          <p className="text-xs text-gray-500 mt-0.5">Expected: {formatDate(order.estimated_delivery)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {order.tracking_number && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">Tracking: <span className="font-mono font-semibold">{order.tracking_number}</span></p>
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-600 hover:underline flex items-center gap-1 mt-1">
                      Track on courier site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product_image ? (
                      <Image src={item.product_image} alt={item.product_name} fill className="object-cover" sizes="64px" />
                    ) : <div className="w-full h-full flex items-center justify-center text-2xl">🥻</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{formatPrice(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-5">
          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-rose-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Delivery Address</h3>
            </div>
            {order.address && (
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-900">{order.address.name}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                <p className="mt-1">📞 {order.address.phone}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-rose-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Payment Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Method</span>
                <span className="font-medium capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span><span>{formatPrice(order.total_amount - order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={order.shipping_amount === 0 ? 'text-green-600' : ''}>{order.shipping_amount === 0 ? 'FREE' : formatPrice(order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span><span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
