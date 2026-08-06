'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatPrice, toTitleCase } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, MoreVertical, ShieldCheck, LogOut, HelpCircle, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import CheckoutBreadcrumb from '@/components/checkout/CheckoutBreadcrumb'
import FloatingInput from '@/components/checkout/FloatingInput'
import AddressAutocomplete from '@/components/checkout/AddressAutocomplete'
import PhoneField from '@/components/admin/PhoneField'
import NavigationGuard from '@/components/NavigationGuard'
import { useFormDraft, clearFormDraft } from '@/lib/useFormDraft'

// ---- Field validation for the delivery form ----
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,}$/   // letters, needs ≥2 chars, no digits
const PIN_RE = /^[1-9][0-9]{5}$/               // 6-digit Indian PIN, not starting 0

function validateAddress(a: {
  firstName: string; lastName: string; line1: string; city: string; state: string; pincode: string; phone: string
}, opts: { phone?: boolean } = { phone: true }): Record<string, string> {
  const e: Record<string, string> = {}
  if (!NAME_RE.test(a.firstName.trim())) e.firstName = 'Enter a valid first name'
  if (!NAME_RE.test(a.lastName.trim())) e.lastName = 'Enter a valid last name'
  if (a.line1.trim().length < 5) e.line1 = 'Enter your full address'
  if (!NAME_RE.test(a.city.trim())) e.city = 'Enter a valid city'
  if (!a.state.trim()) e.state = 'Select a state'
  if (!PIN_RE.test(a.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code'
  // Phone is a full international number (e.g. +91XXXXXXXXXX) from PhoneField.
  if (opts.phone !== false && a.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid mobile number'
  return e
}

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

// Shape of the `address` object stored on a past order.
type SavedAddr = {
  name?: string; first_name?: string; last_name?: string; country?: string
  phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string
}

// Map a past order's saved address into the checkout form shape (splitting an
// old single "name" into first/last when the order predates split names).
function mapSavedAddress(a: SavedAddr): AddressForm {
  const name = (a.name || '').trim()
  const parts = name ? name.split(/\s+/) : []
  return {
    firstName: a.first_name || parts[0] || '',
    lastName: a.last_name || parts.slice(1).join(' ') || '',
    country: a.country || 'India',
    line1: a.line1 || '',
    line2: a.line2 || '',
    city: a.city || '',
    state: a.state || '',
    pincode: a.pincode || '',
    phone: a.phone || '',
  }
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
  const [submitted, setSubmitted] = useState(false) // show errors after a Pay attempt
  const [menuOpen, setMenuOpen] = useState(false)    // account (three-dots) menu
  const [showShipping, setShowShipping] = useState(false) // shipping & return policy popup
  // 'loading' until we know if the user has a saved address; then 'saved' (show
  // the summary card) or 'edit' (show the full form for first-time buyers).
  const [addrMode, setAddrMode] = useState<'loading' | 'saved' | 'edit'>('loading')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the account menu on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Keep the address the user typed for 10 min so a refresh doesn't wipe it.
  useFormDraft('draft:checkout:address', address, setAddress)
  useFormDraft('draft:checkout:billing', billing, setBilling)

  // Live validation errors (only surfaced after a Pay attempt).
  const addressErrors = validateAddress(address)
  const billingErrors = billingSame ? {} : validateAddress(billing, { phone: false })
  const errFor = (f: string) => (submitted ? addressErrors[f] : undefined)
  const billErrFor = (f: string) => (submitted ? billingErrors[f] : undefined)

  // Display strings for the saved-address summary card.
  const savedLine = [address.line1, address.line2, address.city, `${address.state} ${address.pincode}`.trim()]
    .map((s) => s.trim()).filter(Boolean).join(', ')
  const phoneDigits = address.phone.replace(/\D/g, '')
  const phoneDisplay = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits

  // Only guard the leave-page once the delivery form is fully filled in
  // (and the billing address too, when it differs) — nothing to lose before that.
  const isAddressComplete = (a: AddressForm) =>
    !!(a.firstName.trim() && a.lastName.trim() && a.line1.trim() && a.city.trim()
      && a.state.trim() && a.pincode.trim() && a.phone.trim())
  const detailsComplete = isAddressComplete(address) && (billingSame || isAddressComplete(billing))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?redirect=/checkout'); return }
      setUser(data.user as { id: string; email: string })
    })
  }, [])

  // If the cart is empty (e.g. after placing the order), go back to the cart.
  // Done in an effect so it never runs during server render.
  useEffect(() => {
    if (items.length === 0) router.push('/cart')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // Once signed in, look up the most recent past order and reuse its address.
  // Show the summary card only when that saved address is complete/valid,
  // otherwise pre-fill it and open the form so the buyer can finish it.
  useEffect(() => {
    if (!user) return
    let active = true
    fetch('/api/orders')
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then(({ orders }) => {
        if (!active) return
        const withAddr = Array.isArray(orders)
          ? orders.find((o: { address?: SavedAddr }) => o?.address?.line1)
          : null
        if (withAddr?.address) {
          const mapped = mapSavedAddress(withAddr.address)
          setAddress(mapped)
          setAddrMode(Object.keys(validateAddress(mapped)).length === 0 ? 'saved' : 'edit')
        } else {
          setAddrMode('edit')
        }
      })
      .catch(() => { if (active) setAddrMode('edit') })
    return () => { active = false }
  }, [user])

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  // Names → letters only (no digits/symbols); PIN → digits only.
  const clean = (field: keyof AddressForm, value: string) => {
    if (field === 'firstName' || field === 'lastName') return value.replace(/[^A-Za-z .'-]/g, '')
    if (field === 'pincode') return value.replace(/\D/g, '')
    return value
  }
  const handleChange = (field: keyof AddressForm, value: string) => setAddress((prev) => ({ ...prev, [field]: clean(field, value) }))
  const handleBillingChange = (field: keyof AddressForm, value: string) => setBilling((prev) => ({ ...prev, [field]: clean(field, value) }))

  const isAddressValid = Object.keys(addressErrors).length === 0
  const isBillingValid = Object.keys(billingErrors).length === 0

  const placeOrder = async () => {
    setSubmitted(true)
    if (!isAddressValid) { toast.error('Please correct the highlighted delivery fields'); return }
    if (!isBillingValid) { toast.error('Please correct the highlighted billing fields'); return }
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
    clearFormDraft('draft:checkout:address')
    clearFormDraft('draft:checkout:billing')
    toast.success('Order placed successfully!')
    router.push(`/orders/${orderId}`)
  }

  if (items.length === 0) {
    // Redirect handled in the effect below (can't navigate during render/SSR).
    return null
  }

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
    {/* Confirm before leaving the delivery/payment step — only once details are filled. */}
    <NavigationGuard enabled={detailsComplete} />

    {/* Shipping & Return Policy popup */}
    {showShipping && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowShipping(false)} />
        <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 flex items-center justify-between bg-white px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Shipping &amp; Return Policy</h3>
            <button type="button" onClick={() => setShowShipping(false)} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed space-y-3">
            <p><span className="font-semibold text-[#4E1E24]">Dispatch:</span> Orders are inspected and dispatched within 1–3 business days of confirmation.</p>
            <p><span className="font-semibold text-[#4E1E24]">Delivery:</span> Within India typically 3–5 business days after dispatch; international 7–15 business days. Timelines are estimates and may vary with courier, weather, or customs.</p>
            <p><span className="font-semibold text-[#4E1E24]">Charges:</span> Any shipping charge is shown at checkout before payment — no hidden fees. Free-shipping offers appear on site with their terms.</p>
            <p><span className="font-semibold text-[#4E1E24]">Tracking:</span> Once dispatched, a tracking link is shared via email / SMS / WhatsApp.</p>
            <p><span className="font-semibold text-[#4E1E24]">Damaged / wrong item:</span> Contact us within 48 hours of delivery with unboxing photos/video for a resolution.</p>
            <p className="pt-1">
              Full details:{' '}
              <Link href="/shipping-policy" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Shipping Policy</Link>{' '}·{' '}
              <Link href="/refund-policy" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Refund &amp; Return Policy</Link>
            </p>
          </div>
        </div>
      </div>
    )}
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
              <div className="relative" ref={menuRef}>
                <button type="button" aria-label="Account options" onClick={() => setMenuOpen((o) => !o)} className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-28 rounded-md border border-gray-200 bg-white shadow-lg py-0.5 z-20">
                    <button type="button" onClick={signOut} className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery */}
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Delivery</h2>
            {addrMode === 'loading' ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-11 rounded-md bg-gray-100" />
                <div className="h-12 rounded-md bg-gray-100" />
                <div className="h-12 rounded-md bg-gray-100" />
              </div>
            ) : addrMode === 'saved' ? (
              /* Returning buyer — show their saved address with a Change link. */
              <div className="rounded-xl border-2 border-rose-600 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <input type="radio" checked readOnly aria-label="Deliver to this address" className="mt-1 accent-rose-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-gray-900 break-words">{address.firstName} {address.lastName}</p>
                      <button type="button" onClick={() => setAddrMode('edit')} className="text-[#C2185B] font-semibold text-sm hover:underline flex-shrink-0">Change</button>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 break-words">{savedLine}</p>
                    <p className="text-sm text-gray-700 mt-1">Mobile: <span className="font-semibold">{phoneDisplay}</span></p>
                  </div>
                </div>
              </div>
            ) : (
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
                <FloatingInput label="First name" value={address.firstName} onChange={(v) => handleChange('firstName', v)} error={errFor('firstName')} autoComplete="given-name" />
                <FloatingInput label="Last name" value={address.lastName} onChange={(v) => handleChange('lastName', v)} error={errFor('lastName')} autoComplete="family-name" />
              </div>

              <AddressAutocomplete
                label="Address"
                value={address.line1}
                onChange={(v) => handleChange('line1', v)}
                onSelect={({ line1, city, state, pincode }) => setAddress((prev) => ({
                  ...prev,
                  line1: line1 || prev.line1,
                  city: city || prev.city,
                  state: state || prev.state,
                  pincode: pincode || prev.pincode,
                }))}
                error={errFor('line1')}
              />

              <FloatingInput label="Apartment, suite, etc. (optional)" value={address.line2} onChange={(v) => handleChange('line2', v)} autoComplete="address-line2" />

              <div className="grid grid-cols-3 gap-3">
                <FloatingInput label="City" value={address.city} onChange={(v) => handleChange('city', v)} error={errFor('city')} autoComplete="address-level2" />
                <div>
                  <div className="relative">
                    <select
                      value={address.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={`peer h-12 w-full rounded-md border bg-white px-2 pt-4 pb-1 text-sm text-gray-900 focus:outline-none focus:ring-2 ${errFor('state') ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-rose-500'}`}
                    >
                      <option value="">Select</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="pointer-events-none absolute left-2 top-1.5 text-[10px] text-gray-400">State</label>
                  </div>
                  {errFor('state') && <p className="mt-1 text-xs text-red-600">{errFor('state')}</p>}
                </div>
                <FloatingInput label="PIN code" value={address.pincode} onChange={(v) => handleChange('pincode', v)} error={errFor('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" placeholderHint="######" staticLabel />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
                  Mobile number
                  <span className="relative group inline-flex">
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-md bg-gray-800 text-white text-xs font-normal text-center px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg">
                      In case we need to contact you about your order
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </span>
                  </span>
                </label>
                <PhoneField value={address.phone} onChange={(fullPhone) => setAddress((prev) => ({ ...prev, phone: fullPhone }))} />
                {errFor('phone') && <p className="mt-1 text-xs text-red-600">{errFor('phone')}</p>}
              </div>
            </div>
            )}
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
                  <FloatingInput label="First name" value={billing.firstName} onChange={(v) => handleBillingChange('firstName', v)} error={billErrFor('firstName')} />
                  <FloatingInput label="Last name" value={billing.lastName} onChange={(v) => handleBillingChange('lastName', v)} error={billErrFor('lastName')} />
                </div>
                <FloatingInput label="Address" value={billing.line1} onChange={(v) => handleBillingChange('line1', v)} error={billErrFor('line1')} />
                <FloatingInput label="Apartment, suite, etc. (optional)" value={billing.line2} onChange={(v) => handleBillingChange('line2', v)} />
                <div className="grid grid-cols-3 gap-3">
                  <FloatingInput label="City" value={billing.city} onChange={(v) => handleBillingChange('city', v)} error={billErrFor('city')} />
                  <div>
                    <div className="relative">
                      <select
                        value={billing.state}
                        onChange={(e) => handleBillingChange('state', e.target.value)}
                        className={`peer h-12 w-full rounded-md border bg-white px-2 pt-4 pb-1 text-sm text-gray-900 focus:outline-none focus:ring-2 ${billErrFor('state') ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-rose-500'}`}
                      >
                        <option value="">Select</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <label className="pointer-events-none absolute left-2 top-1.5 text-[10px] text-gray-400">State</label>
                    </div>
                    {billErrFor('state') && <p className="mt-1 text-xs text-red-600">{billErrFor('state')}</p>}
                  </div>
                  <FloatingInput label="PIN code" value={billing.pincode} onChange={(v) => handleBillingChange('pincode', v)} error={billErrFor('pincode')} inputMode="numeric" maxLength={6} />
                </div>
              </div>
            )}
          </div>

          {/* Pay now — desktop only (mobile shows it below the summary) */}
          <Button onClick={placeOrder} disabled={loading} className="hidden lg:flex w-full" size="lg">
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
              <span className="inline-flex items-center gap-1">
                Shipping
                <button type="button" onClick={() => setShowShipping(true)} aria-label="Shipping & return policy" className="text-gray-400 hover:text-[#C2185B]">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </span>
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
          <Button onClick={placeOrder} disabled={loading} className="w-full mt-6 lg:hidden" size="lg">
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
