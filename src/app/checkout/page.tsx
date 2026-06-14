'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, CreditCard, Smartphone, Building2, Banknote } from 'lucide-react'
import Image from 'next/image'

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'UPI / Cards / Net Banking', icon: CreditCard, desc: 'Powered by Razorpay — all payment modes' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when your order arrives' },
]

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const router = useRouter()
  const supabase = createClient()

  const [address, setAddress] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?redirect=/checkout'); return }
      setUser(data.user as { id: string; email: string })
    })
  }, [])

  const subtotal = totalPrice()
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const isAddressValid = address.name && address.phone && address.line1 && address.city && address.state && address.pincode

  const placeOrder = async () => {
    if (!isAddressValid) { toast.error('Please fill all address fields'); return }
    if (items.length === 0) { toast.error('Cart is empty'); return }
    setLoading(true)

    try {
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total }),
        })
        const { orderId, key } = await res.json()

        const options = {
          key,
          amount: total * 100,
          currency: 'INR',
          name: 'Dyuthi Pattu Sarees',
          description: 'Saree Purchase',
          order_id: orderId,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
            await createOrder(response.razorpay_payment_id, response.razorpay_order_id)
          },
          prefill: { email: user?.email, contact: address.phone, name: address.name },
          theme: { color: '#be123c' },
        }

        const rzp = new (window as typeof window & { Razorpay: new (opts: typeof options) => { open(): void } }).Razorpay(options)
        rzp.open()
        setLoading(false)
      } else {
        await createOrder(undefined, undefined)
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const createOrder = async (paymentId?: string, razorpayOrderId?: string) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product.name,
          product_image: i.product.images?.[0] || '',
          quantity: i.quantity,
          price: i.product.price,
        })),
        address,
        total_amount: total,
        shipping_amount: shipping,
        payment_method: paymentMethod,
        payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        payment_status: paymentId ? 'paid' : 'pending',
      }),
    })

    if (!res.ok) {
      toast.error('Failed to place order')
      setLoading(false)
      return
    }

    const { orderId } = await res.json()
    clearCart()
    toast.success('Order placed successfully!')
    router.push(`/orders/${orderId}`)
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Delivery Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input value={address.name} onChange={(e) => handleAddressChange('name', e.target.value)} placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <Input value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} placeholder="10-digit mobile number" type="tel" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <Input value={address.line1} onChange={(e) => handleAddressChange('line1', e.target.value)} placeholder="House no., Building, Street" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <Input value={address.line2} onChange={(e) => handleAddressChange('line2', e.target.value)} placeholder="Area, Colony, Locality (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <Input value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <Input value={address.state} onChange={(e) => handleAddressChange('state', e.target.value)} placeholder="State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <Input value={address.pincode} onChange={(e) => handleAddressChange('pincode', e.target.value)} placeholder="6-digit pincode" maxLength={6} />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentMethod === method.id ? 'border-rose-600 bg-rose-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="mt-1 accent-rose-600"
                  />
                  <div className="flex items-start gap-3">
                    <method.icon className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{method.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3 text-sm">
                  <div className="w-10 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {item.product.images?.[0] ? (
                      <Image src={item.product.images[0]} alt="" fill className="object-cover" sizes="40px" />
                    ) : <span className="w-full h-full flex items-center justify-center text-lg">🥻</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1 text-xs">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-xs">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={placeOrder}
              disabled={loading || !isAddressValid}
              className="w-full mt-5"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place Order — ${formatPrice(total)}`}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Secure checkout. Your data is protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
