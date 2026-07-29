'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, toTitleCase } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Search, MoreVertical, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import CheckoutBreadcrumb from '@/components/checkout/CheckoutBreadcrumb'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
]

type AddressForm = {
  firstName: string
  lastName: string
  country: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  phone: string
}

const EMPTY_ADDRESS: AddressForm = {
  firstName: '', lastName: '', country: 'India', line1: '', line2: '', city: '', state: '', pincode: '', phone: '',
}

export default function CheckoutPage() {
  const { selectedItems, removeItems } = useCartStore()
  const items = selectedItems() // only items the user checked on the Cart page
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS)
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState<AddressForm>(EMPTY_ADDRESS)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?redirect=/checkout'); return }
      setUser(data.user as { id: string; email: string })
    })
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  const handleChange = (field: keyof AddressForm, value: string) => setAddress((prev) => ({ ...prev, [field]: value }))
  const handleBillingChange = (field: keyof AddressForm, value: string) => setBilling((prev) => ({ ...prev, [field]: value }))

  const isAddressValid = !!(address.firstName && address.lastName && address.phone && address.line1 && address.city && address.state && address.pincode)
  const isBillingValid = billingSame || !!(billing.firstName && billing.lastName && billing.line1 && billing.city && billing.state && billing.pincode)

  const placeOrder = async () => {
    if (!isAddressValid) { toast.error('Please fill all delivery address fields'); return }
    if (!isBillingValid) { toast.error('Please fill all billing address fields'); return }
    if (items.length === 0) { toast.error('No items selected'); return }
    setLoading(true)

    const fullName = `${address.firstName} ${address.lastName}`.trim()
    const addressPayload: Record<string, unknown> = {
      name: fullName,
      first_name: address.firstName,
      last_name: address.lastName,
      country: address.country,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    }
    if (!billingSame) {
      addressPayload.billing = {
        first_name: billing.firstName,
        last_name: billing.lastName,
        country: billing.country,
        phone: billing.phone,
        line1: billing.line1,
        line2: billing.line2,
        city: billing.city,
        state: billing.state,
        pincode: billing.pincode,
      }
    }

    try {
      // Create Razorpay order — the only available payment method.
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
          await createOrder(addressPayload, response.razorpay_payment_id, response.razorpay_order_id)
        },
        prefill: { email: user?.email, contact: address.phone, name: fullName },
        theme: { color: '#be123c' },
      }

      const rzp = new (window as typeof window & { Razorpay: new (opts: typeof options) => { open(): void } }).Razorpay(options)
      rzp.open()
      setLoading(false)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const createOrder = async (addressPayload: Record<string, unknown>, paymentId?: string, razorpayOrderId?: string) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product.name,
          product_image: i.image || i.product.images?.[0] || '',
          quantity: i.quantity,
          price: i.product.price,
        })),
        address: addressPayload,
        customer_email: user?.email || '',
        total_amount: total,
        shipping_amount: shipping,
        payment_method: 'razorpay',
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
    // Only remove the items that were actually ordered — anything the user
    // left unselected on the Cart page stays there untouched.
    removeItems(items.map((i) => i.key))
    toast.success('Order placed successfully!')
    router.push(`/orders/${orderId}`)
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const inputClass = 'h-11'

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-5xl mx-auto">
        <CheckoutBreadcrumb active="delivery" />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivery</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Account strip + Delivery + Shipping + Payment + Billing */}
        <div className="space-y-6">
          {/* Signed-in-as strip */}
          {user && (
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {(user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span className="text-sm text-gray-800 truncate flex-1">{user.email}</span>
              <button type="button" aria-label="Account options" className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Delivery */}
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Delivery</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Country/Region</label>
                <select
                  value={address.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <option value="India">India</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input className={inputClass} value={address.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="First name" />
                <Input className={inputClass} value={address.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Last name" />
              </div>

              <div className="relative">
                <Input className={`${inputClass} pr-9`} value={address.line1} onChange={(e) => handleChange('line1', e.target.value)} placeholder="Address" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <Input className={inputClass} value={address.line2} onChange={(e) => handleChange('line2', e.target.value)} placeholder="Apartment, suite, etc. (optional)" />

              <div className="grid grid-cols-3 gap-3">
                <Input className={inputClass} value={address.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">State</label>
                  <select
                    value={address.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="h-11 w-full rounded-md border border-gray-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Input className={inputClass} value={address.pincode} onChange={(e) => handleChange('pincode', e.target.value)} placeholder="PIN code" maxLength={6} />
              </div>

              <Input className={inputClass} value={address.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" type="tel" />
            </div>
          </div>

          {/* Shipping method */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Shipping method</h2>
            {isAddressValid ? (
              <div className="flex items-center justify-between rounded-xl border-2 border-rose-600 bg-rose-50 p-4 text-sm">
                <span className="font-medium text-gray-900">Standard Shipping</span>
                <span className={shipping === 0 ? 'font-semibold text-green-600' : 'font-semibold text-gray-900'}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Enter your shipping address to view available shipping methods.
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <h2 className="font-bold text-gray-900">Payment</h2>
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> All transactions are secure and encrypted.
            </p>
            <div className="rounded-xl border-2 border-rose-600 bg-rose-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-900">Razorpay Secure (UPI, Cards, Int&apos;l Cards, Wallets)</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-white bg-[#6C37F4] rounded px-1.5 py-0.5">UPI</span>
                  <span className="text-[10px] font-bold text-white bg-[#1A1F71] rounded px-1.5 py-0.5">VISA</span>
                  <span className="text-[10px] font-bold text-white bg-[#EB001B] rounded px-1.5 py-0.5">MC</span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">+18</span>
                </div>
              </div>
              <div className="bg-white px-4 py-3 text-xs text-gray-500 border-t border-rose-100">
                You&apos;ll be redirected to Razorpay Secure (UPI, Cards, Int&apos;l Cards, Wallets) to complete your purchase.
              </div>
            </div>
          </div>

          {/* Billing address */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Billing address</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${billingSame ? 'border-rose-600 bg-rose-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="billing" checked={billingSame} onChange={() => setBillingSame(true)} className="accent-rose-600" />
                <span className="text-sm text-gray-900">Same as shipping address</span>
              </label>
              <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${!billingSame ? 'border-rose-600 bg-rose-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="radio" name="billing" checked={!billingSame} onChange={() => setBillingSame(false)} className="accent-rose-600" />
                <span className="text-sm text-gray-900">Use a different billing address</span>
              </label>
            </div>

            {!billingSame && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input className={inputClass} value={billing.firstName} onChange={(e) => handleBillingChange('firstName', e.target.value)} placeholder="First name" />
                  <Input className={inputClass} value={billing.lastName} onChange={(e) => handleBillingChange('lastName', e.target.value)} placeholder="Last name" />
                </div>
                <Input className={inputClass} value={billing.line1} onChange={(e) => handleBillingChange('line1', e.target.value)} placeholder="Address" />
                <Input className={inputClass} value={billing.line2} onChange={(e) => handleBillingChange('line2', e.target.value)} placeholder="Apartment, suite, etc. (optional)" />
                <div className="grid grid-cols-3 gap-3">
                  <Input className={inputClass} value={billing.city} onChange={(e) => handleBillingChange('city', e.target.value)} placeholder="City" />
                  <select
                    value={billing.state}
                    onChange={(e) => handleBillingChange('state', e.target.value)}
                    className="h-11 w-full rounded-md border border-gray-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <option value="">State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Input className={inputClass} value={billing.pincode} onChange={(e) => handleBillingChange('pincode', e.target.value)} placeholder="PIN code" maxLength={6} />
                </div>
                <Input className={inputClass} value={billing.phone} onChange={(e) => handleBillingChange('phone', e.target.value)} placeholder="Phone" type="tel" />
              </div>
            )}
          </div>

          {/* Pay now — desktop only (mobile shows it below the summary) */}
          <Button onClick={placeOrder} disabled={loading || !isAddressValid || !isBillingValid} className="hidden lg:flex w-full" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay now'}
          </Button>
        </div>

        {/* Right: Order summary */}
        <div className="lg:pl-6 lg:border-l lg:border-gray-100">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 text-sm">
                <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                  ) : <span className="w-full h-full flex items-center justify-center text-lg">🥻</span>}
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <p className="flex-1 min-w-0 text-gray-900">{toTitleCase(item.product.name)}</p>
                <p className="font-medium text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal · {itemCount} item{itemCount === 1 ? '' : 's'}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              {isAddressValid ? (
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              ) : (
                <span className="text-gray-400">Enter shipping address</span>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-2.5 border-t border-gray-100 font-bold text-gray-900">
              <span className="text-base">Total</span>
              <span className="text-lg">
                <span className="text-xs font-normal text-gray-500 mr-1 align-baseline">INR</span>
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Pay now — mobile */}
          <Button onClick={placeOrder} disabled={loading || !isAddressValid || !isBillingValid} className="w-full mt-6 lg:hidden" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay now'}
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
