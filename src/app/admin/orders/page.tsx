'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Order, OrderItem, OrderStatus, PaymentStatus, ADMIN_ORDER_STATUSES, PAYMENT_STATUSES, Product, ORDER_SOURCES, ORDER_SOURCE_LABELS, MANUAL_ORDER_SOURCES, isOnlineSource } from '@/types'
import NavigationGuard from '@/components/NavigationGuard'
import { formatPrice, isValidEmail } from '@/lib/utils'
import { Loader2, Plus, Trash2, X, ShoppingCart, Phone, Eye, Save, Clock, CheckCircle2, Package, Truck, XCircle, CalendarClock, Pencil, RotateCcw, Star } from 'lucide-react'
import { toast } from 'sonner'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js'
import PhoneField from '@/components/admin/PhoneField'
import { useHighlight, HIGHLIGHT_RING } from '@/lib/use-highlight'

// Split an E.164 phone (e.g. +919876543210) into { code: '+91', national: '9876543210' }.
function splitPhone(e164: string): { code: string; national: string } | null {
  try {
    const p = parsePhoneNumber(e164)
    if (!p) return null
    return { code: `+${p.countryCallingCode}`, national: p.nationalNumber }
  } catch { return null }
}

// Per-status look: flag pill colours + icon, and the outline/count-badge colours
// for the top filter chips. Colours match the reference status flags.
const STATUS_META: Record<string, { icon: typeof Clock; pill: string; border: string; badge: string }> = {
  pending: { icon: Clock, pill: 'bg-orange-50 text-orange-600', border: 'border-orange-300', badge: 'bg-orange-500' },
  'pre-booking': { icon: CalendarClock, pill: 'bg-teal-50 text-teal-600', border: 'border-teal-300', badge: 'bg-teal-500' },
  confirmed: { icon: CheckCircle2, pill: 'bg-blue-50 text-blue-600', border: 'border-blue-300', badge: 'bg-blue-500' },
  packed: { icon: Package, pill: 'bg-purple-50 text-purple-600', border: 'border-purple-300', badge: 'bg-purple-500' },
  shipped: { icon: Truck, pill: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-300', badge: 'bg-indigo-500' },
  delivered: { icon: CheckCircle2, pill: 'bg-green-50 text-green-600', border: 'border-green-300', badge: 'bg-green-500' },
  cancelled: { icon: XCircle, pill: 'bg-red-50 text-red-600', border: 'border-red-300', badge: 'bg-red-500' },
}
const PAY_STYLES: Record<string, string> = { pending: 'bg-amber-50 text-amber-600', paid: 'bg-green-50 text-green-600', failed: 'bg-red-50 text-red-600', refunded: 'bg-gray-100 text-gray-500' }
const PAY_META: Record<string, { icon: typeof Clock; pill: string }> = {
  pending: { icon: Clock, pill: 'bg-amber-50 text-amber-600' },
  paid: { icon: CheckCircle2, pill: 'bg-green-50 text-green-600' },
  failed: { icon: XCircle, pill: 'bg-red-50 text-red-600' },
  refunded: { icon: RotateCcw, pill: 'bg-gray-100 text-gray-500' },
}

// A payment-status flag/dropdown, styled like the order-status flag.
function PaymentFlag({ value, onChange }: { value: string; onChange: (v: PaymentStatus) => void }) {
  const m = PAY_META[value] || PAY_META.pending
  const Icon = m.icon
  return (
    <div className={`relative inline-flex items-center rounded-full ${m.pill}`}>
      <Icon className="h-3.5 w-3.5 absolute left-2 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PaymentStatus)}
        className={`appearance-none bg-transparent text-xs font-semibold capitalize pl-7 pr-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${m.pill}`}
      >
        {PAYMENT_STATUSES.map((s) => <option key={s} value={s} className="capitalize bg-white text-gray-700">{s}</option>)}
      </select>
    </div>
  )
}

// A status flag that is also a dropdown to update the order status.
function StatusFlag({ value, onChange }: { value: string; onChange: (v: OrderStatus) => void }) {
  const m = STATUS_META[value] || STATUS_META.pending
  const Icon = m.icon
  return (
    <div className={`relative inline-flex items-center rounded-full ${m.pill}`}>
      <Icon className="h-3.5 w-3.5 absolute left-2 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className={`appearance-none bg-transparent text-xs font-semibold capitalize pl-7 pr-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${m.pill}`}
      >
        {ADMIN_ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize bg-white text-gray-700">{s}</option>)}
      </select>
    </div>
  )
}

// Outline + count-badge filter chip. When selected it fills with a LIGHT tint of
// its status colour so the active filter is clear without being heavy.
function OrderChip({ meta, label, count, active, onClick }: { meta?: { border: string; badge: string; pill?: string }; label: string; count: number; active: boolean; onClick: () => void }) {
  const isAll = !meta
  const border = meta?.border ?? 'border-[#4E1E24]/30'
  const badge = meta?.badge ?? 'bg-[#4E1E24]'
  const pill = meta?.pill ?? 'bg-[#4E1E24]/5 text-[#4E1E24]'
  const activeSolid = active && isAll // 'All' fills solid maroon when selected
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 sm:gap-2 rounded-full border pl-2.5 pr-1 py-0.5 sm:pl-4 sm:pr-1.5 sm:py-1 text-xs sm:text-sm capitalize whitespace-nowrap transition-colors ${border} ${activeSolid ? 'bg-[#4E1E24] border-transparent text-white font-medium' : active ? `${pill} font-medium` : 'bg-white text-gray-900 font-normal'}`}
    >
      {label}
      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 sm:px-1.5 rounded-full text-[10px] sm:text-xs font-bold text-white ${activeSolid ? 'bg-white/25' : badge}`}>{count}</span>
    </button>
  )
}

type Line = { product_id: string | null; product_name: string; product_image: string | null; quantity: number; price: number }

// Display any name in Title Case regardless of how it was typed.
function titleCase(name?: string | null) {
  return (name || 'Guest').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// Initials for the customer avatar, e.g. "Lakshmi Devi" → "LD".
function initials(name?: string | null) {
  const parts = (name || 'Guest').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'G'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const inputCls = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

function SourceTag({ source }: { source?: string | null }) {
  const s = source || 'website'
  const online = isOnlineSource(s)
  const channel = ORDER_SOURCE_LABELS[s as keyof typeof ORDER_SOURCE_LABELS] || s
  const cls = online ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls}`}
      title={online ? 'From: Website (Online)' : `From: ${channel}`}
    >
      {online ? '🌐 Online' : '🏪 Offline'}
    </span>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState<Order | null>(null)
  const [editing, setEditing] = useState<Order | null>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const highlight = useHighlight('/admin/orders')

  const load = () => {
    fetch('/api/admin/orders').then((r) => r.json()).then(({ orders }) => { setOrders(orders || []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => {
    load()
    fetch('/api/admin/products').then((r) => r.json()).then(({ products }) => setProducts(products || [])).catch(() => {})
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const applyPatch = (id: string, patch: Partial<Order>) => {
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }
  const replaceOrder = (updated: Order) => {
    setOrders((p) => p.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
  }

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    applyPatch(id, patch)
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!res.ok) { toast.error('Update failed'); load() } else toast.success('Order updated')
  }
  const deleteOrder = async (id: string, n?: string | null) => {
    if (!confirm(`Delete order ${n || ''}?`)) return
    setOrders((p) => p.filter((o) => o.id !== id))
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); load() } else toast.success('Order deleted')
  }

  // ---- Post-delivery review request (WhatsApp / Email / copy link) ----
  const [reviewMenuFor, setReviewMenuFor] = useState<string | null>(null)

  // Always send the live-site link — WhatsApp/email need the public URL,
  // and localhost links aren't clickable for customers anyway.
  const reviewLink = (o: Order) => {
    const origin = window.location.hostname === 'localhost' ? 'https://www.dyuthipattusarees.com' : window.location.origin
    return `${origin}/review/${o.id}`
  }
  const reviewMessage = (o: Order) =>
    `Namaste${o.customer_name ? ` ${o.customer_name}` : ''}! 🙏\n\n` +
    `Your order from Dyuthi Pattu Sarees has been delivered successfully. ` +
    `We would love to hear your experience!\n\nLeave a review here:\n${reviewLink(o)}`

  const reviewViaWhatsApp = (o: Order) => {
    if (!o.customer_phone) { toast.error('This order has no phone number'); return }
    const phone = `${(o.customer_country_code || '+91').replace('+', '')}${o.customer_phone}`.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(reviewMessage(o))}`, '_blank', 'noopener')
    setReviewMenuFor(null)
  }
  const reviewViaEmail = (o: Order) => {
    if (!o.customer_email) { toast.error('This order has no email — add one via Edit'); return }
    const subject = 'We would love your review — Dyuthi Pattu Sarees'
    // Open Gmail's web compose directly (mailto: is unreliable on Windows when
    // no desktop mail app is configured) — To/Subject/Body arrive prefilled.
    const url =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(o.customer_email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(reviewMessage(o))}`
    window.open(url, '_blank', 'noopener')
    setReviewMenuFor(null)
  }
  const copyReviewLink = async (o: Order) => {
    try { await navigator.clipboard.writeText(reviewLink(o)); toast.success('Review link copied') }
    catch { toast.error('Could not copy — link: ' + reviewLink(o)) }
    setReviewMenuFor(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Orders</h1>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-xs px-2.5 py-1.5 sm:text-sm sm:px-3.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
          <Plus className="h-4 w-4" /> Create Order
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2.5 mb-4">
        <OrderChip label="All" count={orders.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        {ADMIN_ORDER_STATUSES.map((s) => (
          <OrderChip key={s} meta={STATUS_META[s]} label={s} count={orders.filter((o) => o.status === s).length} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} data-hl={o.id} className={`bg-white rounded-xl border border-gray-100 px-4 py-2 overflow-x-auto md:overflow-visible ${highlight === o.id ? HIGHLIGHT_RING : ''}`}>
              <div className="flex items-center justify-between gap-3 min-w-max md:min-w-0">
                {/* Left: order info + items */}
                <div className="flex-shrink-0 md:flex-1 md:min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap md:flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{o.order_number || o.id.slice(0, 8)}</p>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#5A0B2D] text-white text-[10px] font-semibold flex-shrink-0">{initials(o.customer_name)}</span>
                      <span className="text-sm font-bold text-[#5A0B2D]">{titleCase(o.customer_name)}</span>
                    </span>
                    {o.customer_phone && <a href={`tel:${(o.customer_country_code || '') + o.customer_phone}`} className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" /> {o.customer_country_code ? `${o.customer_country_code} ` : ''}{o.customer_phone}</a>}
                    <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString('en-IN')}</span>
                    <SourceTag source={o.source} />
                  </div>
                  {o.items && o.items.length > 0 && (
                    <div className="flex flex-nowrap md:flex-wrap gap-2 mt-2">
                      {(o.items as OrderItem[]).map((it) => (
                        <div key={it.id} className="flex items-center gap-2 bg-gray-50 rounded-md pl-1 pr-2.5 py-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => it.product_image && setPreviewImg(it.product_image)}
                            className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-200 cursor-zoom-in"
                            title="Preview image"
                          >
                            {it.product_image && <Image src={it.product_image} alt={it.product_name} fill className="object-cover" sizes="40px" />}
                          </button>
                          <span className="text-xs text-gray-700 max-w-[160px] truncate">{it.product_name}</span>
                          <span className="text-xs font-semibold text-[#AD1457]">×{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: actions + statuses + price, vertically centered, inset from the edge */}
                <div className="flex items-center gap-2 flex-nowrap md:flex-wrap justify-end flex-shrink-0 sm:mr-10">
                  <button onClick={() => setEditing(o)} className="p-1.5 text-gray-400 hover:text-[#AD1457] hover:bg-rose-50 rounded-lg" title="Edit"><Pencil className="h-4 w-4" /></button>
                  {o.status === 'delivered' && (
                    <div className="relative">
                      <button
                        onClick={() => setReviewMenuFor(reviewMenuFor === o.id ? null : o.id)}
                        className={`p-1.5 rounded-lg ${reviewMenuFor === o.id ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                        title="Request review"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      {reviewMenuFor === o.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                          <button
                            onClick={() => reviewViaWhatsApp(o)}
                            disabled={!o.customer_phone}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            Send via WhatsApp
                          </button>
                          <button
                            onClick={() => reviewViaEmail(o)}
                            disabled={!o.customer_email}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:hover:bg-transparent"
                            title={o.customer_email || 'No email on this order'}
                          >
                            Send via Email
                          </button>
                          <button
                            onClick={() => copyReviewLink(o)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            Copy review link
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setViewing(o)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => deleteOrder(o.id, o.order_number)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  <StatusFlag value={o.status} onChange={(v) => updateOrder(o.id, { status: v })} />
                  <PaymentFlag value={o.payment_status} onChange={(v) => updateOrder(o.id, { payment_status: v })} />
                  <p className="text-lg font-bold text-[#AD1457] ml-1">{formatPrice(o.total_amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm before leaving while adding/editing an order. */}
      <NavigationGuard enabled={showAdd || !!editing} />
      {showAdd && <CreateOrderModal products={products} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
      {editing && <EditOrderModal order={editing} products={products} onClose={() => setEditing(null)} onSaved={(o) => { replaceOrder(o); setEditing(null) }} />}
      {viewing && <ViewOrderModal order={viewing} onClose={() => setViewing(null)} />}

      {/* Ordered-item image preview */}
      {previewImg && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:text-gray-900"><X className="h-5 w-5" /></button>
            <div className="relative w-full h-[70vh] bg-white rounded-xl overflow-hidden">
              <Image src={previewImg} alt="Ordered saree" fill quality={90} className="object-contain" sizes="600px" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Read-only view of an order.
function ViewOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const addr = (order.address as { line1?: string; pincode?: string } | null) || null
  const sm = STATUS_META[order.status] || STATUS_META.pending
  const StatusIcon = sm.icon
  const phoneStr = order.customer_phone ? `${order.customer_country_code ? order.customer_country_code + ' ' : ''}${order.customer_phone}` : '—'
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#4E1E24]">{order.order_number || order.id.slice(0, 8)}</h2>
            <SourceTag source={order.source} />
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{new Date(order.created_at).toLocaleString('en-IN')}</p>

        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${sm.pill}`}><StatusIcon className="h-3.5 w-3.5" /> {order.status}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${PAY_STYLES[order.payment_status] || 'bg-gray-100'}`}>{order.payment_status}</span>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <Field label="Customer" value={titleCase(order.customer_name)} />
          <Field label="Mobile" value={phoneStr} />
          <div className="col-span-2"><Field label="Email" value={order.customer_email || '—'} /></div>
          <div className="col-span-2"><Field label="Address" value={addr?.line1 || '—'} /></div>
          <Field label="Pincode" value={addr?.pincode || '—'} />
          {order.tracking_number && <Field label="Tracking" value={order.tracking_number} />}
        </div>

        {/* Items */}
        <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Items</h3>
        <div className="space-y-2">
          {(order.items as OrderItem[] || []).map((it) => (
            <div key={it.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-2">
              <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                {it.product_image && <Image src={it.product_image} alt={it.product_name} fill className="object-cover" sizes="48px" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{it.product_name}</p>
                <p className="text-xs text-gray-400">{formatPrice(it.price)} × {it.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-700">{formatPrice(it.price * it.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-sm font-bold text-[#4E1E24]"><span>Total</span><span>{formatPrice(order.total_amount)}</span></div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-gray-800 break-words">{value}</p>
    </div>
  )
}

// Full edit — any order field can be changed, including the items.
function EditOrderModal({ order, products, onClose, onSaved }: { order: Order; products: Product[]; onClose: () => void; onSaved: (o: Order) => void }) {
  const existingPhone = order.customer_phone || ''
  const initialPhone = existingPhone.startsWith('+')
    ? existingPhone.replace(/[^\d+]/g, '')
    : `${order.customer_country_code || '+91'}${existingPhone}`.replace(/[^\d+]/g, '')
  const addr = (order.address as { line1?: string; pincode?: string } | null) || null
  const [name, setName] = useState(order.customer_name || '')
  const [phone, setPhone] = useState(initialPhone || '+91')
  const [address, setAddress] = useState(addr?.line1 || '')
  const [pincode, setPincode] = useState(addr?.pincode || '')
  const [status, setStatus] = useState<string>(order.status)
  const [payment, setPayment] = useState<string>(order.payment_status)
  const [source, setSource] = useState<string>(order.source || 'website')
  const [tracking, setTracking] = useState(order.tracking_number || '')
  const [email, setEmail] = useState(order.customer_email || '')
  const [emailError, setEmailError] = useState('')
  const checkEmail = (v: string) => {
    const bad = !!v.trim() && !isValidEmail(v)
    setEmailError(bad ? 'Please enter a valid email address' : '')
    return !bad
  }
  const [lines, setLines] = useState<Line[]>((order.items as OrderItem[] || []).map((it) => ({ product_id: it.product_id || null, product_name: it.product_name, product_image: it.product_image || null, quantity: it.quantity, price: it.price })))
  const [pid, setPid] = useState('')
  const [selVars, setSelVars] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const onName = (v: string) => setName(v.replace(/[^A-Za-z ]/g, ''))
  const onPincode = (v: string) => setPincode(v.replace(/\D/g, '').slice(0, 6))
  const onAddress = (v: string) => setAddress(v.replace(/[^A-Za-z0-9 ,.\-/#]/g, ''))

  const selectedProduct = products.find((x) => x.id === pid)
  const variants = (selectedProduct?.color_variants || []).filter((v) => v.image)
  const hasVariants = variants.length > 0

  const addLine = () => {
    const p = selectedProduct
    if (!p) return
    if (hasVariants && selVars.length === 0) return toast.error('Please select at least one item')
    const targets: (string | null)[] = hasVariants ? selVars : [null]
    const newLines = targets.map((img) => {
      const idx = variants.findIndex((v) => v.image === img)
      const image = img || p.images?.[0] || null
      const label = hasVariants && idx !== -1 ? `${p.name} · Item ${idx + 1}` : p.name
      return { product_id: p.id, product_name: label, product_image: image, quantity: 1, price: p.price }
    })
    setLines((l) => [...l, ...newLines])
    setPid(''); setSelVars([])
  }
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0)

  const save = async () => {
    if (!name.trim()) return toast.error('Customer name is required')
    if (!/^[A-Za-z ]+$/.test(name.trim())) return toast.error('Name can contain only alphabets')
    const hasNumber = phone.replace(/\D/g, '').length > 3
    if (hasNumber && !isValidPhoneNumber(phone)) return toast.error('Enter a valid mobile number for the selected country')
    if (pincode && !/^\d{6}$/.test(pincode)) return toast.error('Enter a valid 6-digit pincode')
    if (!checkEmail(email)) return toast.error('Enter a valid email address')
    if (lines.length === 0) return toast.error('Please select at least one product')
    const parts = hasNumber ? splitPhone(phone) : null
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name.trim(),
        customer_country_code: parts?.code ?? null,
        customer_phone: parts?.national ?? null,
        customer_email: email.trim() || null,
        address: address.trim(),
        pincode,
        status,
        payment_status: payment,
        source,
        tracking_number: tracking.trim() || null,
        items: lines,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const { order: updated } = await res.json()
      onSaved(updated as Order)
      toast.success('Order updated')
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed' }))
      toast.error(error || 'Failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#4E1E24]">Edit Order — {order.order_number || order.id.slice(0, 8)}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Customer name *</label>
              <input value={name} onChange={(e) => onName(e.target.value)} placeholder="Alphabets only" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Mobile number</label>
              <PhoneField value={phone} onChange={(full) => setPhone(full)} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) checkEmail(e.target.value) }}
              onBlur={(e) => checkEmail(e.target.value)}
              placeholder="customer@example.com (optional)"
              className={`${inputCls} ${emailError ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Address</label>
            <textarea value={address} onChange={(e) => onAddress(e.target.value)} rows={2} placeholder="House no, street, area, city" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Pincode</label>
              <input value={pincode} onChange={(e) => onPincode(e.target.value)} inputMode="numeric" placeholder="######" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>{ORDER_SOURCES.map((s) => <option key={s} value={s}>{ORDER_SOURCE_LABELS[s]}</option>)}</select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Tracking</label>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-400">Add product</label>
            <select value={pid} onChange={(e) => { setPid(e.target.value); setSelVars([]) }} className={inputCls}>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>)}
            </select>
          </div>
          {selectedProduct && hasVariants && (
            <div>
              <label className="text-[11px] text-gray-400">Select item(s) — pick one or more</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {variants.map((v, i) => {
                  const active = selVars.includes(v.image)
                  return (
                    <button key={v.image} type="button" onClick={() => setSelVars((prev) => prev.includes(v.image) ? prev.filter((x) => x !== v.image) : [...prev, v.image])} className={`flex items-center gap-1.5 rounded-lg border p-1 pr-2.5 transition-colors ${active ? 'border-[#AD1457] bg-rose-50' : 'border-gray-200 hover:border-[#AD1457]'}`}>
                      <span className="relative h-9 w-9 rounded-md overflow-hidden bg-gray-100">{v.image && <Image src={v.image} alt={`Item ${i + 1}`} fill className="object-cover" sizes="36px" />}</span>
                      <span className="text-xs text-gray-700">Item {i + 1}</span>
                      <span className="text-xs text-gray-400">×{v.quantity}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {pid && <button onClick={addLine} disabled={hasVariants && selVars.length === 0} className="w-full h-10 rounded-lg bg-rose-50 text-[#AD1457] font-medium text-sm disabled:opacity-50">Add items to order</button>}

          {lines.length > 0 && (
            <div className="space-y-2 border border-gray-100 rounded-lg p-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="relative h-8 w-8 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">{l.product_image && <Image src={l.product_image} alt={l.product_name} fill className="object-cover" sizes="32px" />}</div>
                  <span className="flex-1 truncate">{l.product_name}</span>
                  <input type="number" min={1} value={l.quantity} onChange={(e) => setLines((arr) => arr.map((x, j) => j === i ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} className="w-14 h-8 rounded border border-gray-200 px-2 text-center" />
                  <span className="w-20 text-right text-gray-600">{formatPrice(l.price * l.quantity)}</span>
                  <button onClick={() => setLines((arr) => arr.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-bold text-[#4E1E24]"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Order Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>{ADMIN_ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Payment</label>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputCls}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
            </div>
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateOrderModal({ products, onClose, onCreated }: { products: Product[]; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+91')   // full E.164 from PhoneField
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const checkEmail = (v: string) => {
    const bad = !!v.trim() && !isValidEmail(v)
    setEmailError(bad ? 'Please enter a valid email address' : '')
    return !bad
  }
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [status, setStatus] = useState<string>('confirmed')
  const [payment, setPayment] = useState<string>('pending')
  const [source, setSource] = useState<string>('whatsapp')
  const [lines, setLines] = useState<Line[]>([])
  const [pid, setPid] = useState('')
  const [selVars, setSelVars] = useState<string[]>([]) // selected colour/item image
  const [saving, setSaving] = useState(false)

  // Input filters
  const onName = (v: string) => setName(v.replace(/[^A-Za-z ]/g, ''))            // letters + spaces only
  const onPincode = (v: string) => setPincode(v.replace(/\D/g, '').slice(0, 6))    // digits only, max 6
  const onAddress = (v: string) => setAddress(v.replace(/[^A-Za-z0-9 ,.\-/#]/g, '')) // alphanumeric + basic punctuation

  const selectedProduct = products.find((x) => x.id === pid)
  const variants = (selectedProduct?.color_variants || []).filter((v) => v.image)
  const hasVariants = variants.length > 0

  const addLine = () => {
    const p = selectedProduct
    if (!p) return
    if (hasVariants && selVars.length === 0) return toast.error('Please select at least one item')
    const targets: (string | null)[] = hasVariants ? selVars : [null]
    const newLines = targets.map((img) => {
      const idx = variants.findIndex((v) => v.image === img)
      const image = img || p.images?.[0] || null
      const label = hasVariants && idx !== -1 ? `${p.name} · Item ${idx + 1}` : p.name
      return { product_id: p.id, product_name: label, product_image: image, quantity: 1, price: p.price }
    })
    setLines((l) => [...l, ...newLines])
    setPid('')
    setSelVars([])
  }
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0)

  const save = async () => {
    if (!name.trim()) return toast.error('Customer name is required')
    if (!/^[A-Za-z ]+$/.test(name.trim())) return toast.error('Name can contain only alphabets')
    if (!isValidPhoneNumber(phone)) return toast.error('Enter a valid mobile number for the selected country')
    if (!checkEmail(email)) return toast.error('Enter a valid email address')
    if (!address.trim()) return toast.error('Address is required')
    if (!/^\d{6}$/.test(pincode)) return toast.error('Enter a valid 6-digit pincode')
    if (lines.length === 0) return toast.error('Please select at least one product')
    const parts = splitPhone(phone)!
    setSaving(true)
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: name.trim(),
        customer_country_code: parts.code,
        customer_phone: parts.national,
        customer_email: email.trim() || null,
        address: address.trim(),
        pincode,
        status,
        payment_status: payment,
        source,
        items: lines,
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Order created'); onCreated() } else { const { error } = await res.json(); toast.error(error || 'Failed') }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#4E1E24]">Create Order</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Customer name *</label>
              <input value={name} onChange={(e) => onName(e.target.value)} placeholder="Alphabets only" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Mobile number *</label>
              <PhoneField value={phone} onChange={(full) => setPhone(full)} />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) checkEmail(e.target.value) }}
              onBlur={(e) => checkEmail(e.target.value)}
              placeholder="customer@example.com (optional)"
              className={`${inputCls} ${emailError ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Address *</label>
            <textarea value={address} onChange={(e) => onAddress(e.target.value)} rows={2} placeholder="House no, street, area, city" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Pincode *</label>
              <input value={pincode} onChange={(e) => onPincode(e.target.value)} inputMode="numeric" placeholder="######" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Source (channel)</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
                {MANUAL_ORDER_SOURCES.map((s) => <option key={s} value={s}>{ORDER_SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Add product</label>
            <select value={pid} onChange={(e) => { setPid(e.target.value); setSelVars([]) }} className={inputCls}>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>)}
            </select>
          </div>

          {/* Pick which item/colour the customer bought */}
          {selectedProduct && hasVariants && (
            <div>
              <label className="text-[11px] text-gray-400">Select item(s) — pick one or more</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {variants.map((v, i) => {
                  const active = selVars.includes(v.image)
                  return (
                    <button
                      key={v.image}
                      type="button"
                      onClick={() => setSelVars((prev) => prev.includes(v.image) ? prev.filter((x) => x !== v.image) : [...prev, v.image])}
                      className={`flex items-center gap-1.5 rounded-lg border p-1 pr-2.5 transition-colors ${active ? 'border-[#AD1457] bg-rose-50' : 'border-gray-200 hover:border-[#AD1457]'}`}
                    >
                      <span className="relative h-9 w-9 rounded-md overflow-hidden bg-gray-100">
                        {v.image && <Image src={v.image} alt={`Item ${i + 1}`} fill className="object-cover" sizes="36px" />}
                      </span>
                      <span className="text-xs text-gray-700">Item {i + 1}</span>
                      <span className="text-xs text-gray-400">×{v.quantity}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {pid && (
            <button onClick={addLine} disabled={hasVariants && selVars.length === 0} className="w-full h-10 rounded-lg bg-rose-50 text-[#AD1457] font-medium text-sm disabled:opacity-50">
              Add items to order
            </button>
          )}
          {lines.length > 0 && (
            <div className="space-y-2 border border-gray-100 rounded-lg p-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="relative h-8 w-8 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {l.product_image && <Image src={l.product_image} alt={l.product_name} fill className="object-cover" sizes="32px" />}
                  </div>
                  <span className="flex-1 truncate">{l.product_name}</span>
                  <input type="number" min={1} value={l.quantity} onChange={(e) => setLines((arr) => arr.map((x, j) => j === i ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} className="w-14 h-8 rounded border border-gray-200 px-2 text-center" />
                  <span className="w-20 text-right text-gray-600">{formatPrice(l.price * l.quantity)}</span>
                  <button onClick={() => setLines((arr) => arr.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-bold text-[#4E1E24]"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400">Order Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>{ADMIN_ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Payment</label>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputCls}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="w-full bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
