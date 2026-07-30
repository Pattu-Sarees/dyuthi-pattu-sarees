'use client'

import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { formatPrice, toTitleCase } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Check, Share2, HeartHandshake, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import CheckoutBreadcrumb from '@/components/checkout/CheckoutBreadcrumb'
import { CartItem } from '@/types'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Lazy-loaded: only pulled in when the shopper opens the share dialog, keeping
// it out of the initial cart-page bundle.
const ShareCartModal = dynamic(() => import('@/components/cart/ShareCartModal'))

// Mobile-only hint, anchored right under whichever icon was clicked with
// nothing selected. Desktop shows a top-center toast instead (see
// requireSelection in CartPage), so this stays hidden at lg+.
function SelectionHint() {
  return (
    <div
      className="lg:hidden absolute top-full right-0 mt-2 z-50 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold shadow-lg"
      style={{ background: '#5A1F2B', color: '#FFF8F2', border: '1px solid #C9A227' }}
    >
      Please select atleast one item
    </div>
  )
}

export default function CartPage() {
  const { items, removeItem, removeItems, updateQuantity, deselected, toggleSelected, selectedItems } = useCartStore()
  const wishlistAdd = useWishlistStore((s) => s.add)
  const [confirmRemove, setConfirmRemove] = useState<CartItem | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  // Mobile-only inline hint shown right under the clicked icon (desktop uses
  // a banner anchored to the "My Cart" heading instead — see requireSelection below).
  const [selectionHint, setSelectionHint] = useState<'share' | 'delete' | 'wishlist' | null>(null)
  const [showDesktopHint, setShowDesktopHint] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [ownerName, setOwnerName] = useState('My')
  const [userId, setUserId] = useState<string | null>(null)

  // Resolve the shopper's identity for the share link (stable link for
  // logged-in users, anonymous dedupe otherwise — see /api/cart/share).
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          setOwnerName(profile?.full_name?.trim() || data.user!.email?.split('@')[0] || 'My')
        })
    })
  }, [])

  const selected = selectedItems()
  const selectedCount = selected.length
  const hasSelection = selectedCount > 0

  // Flagged from what's already in the cart item (stock captured at add-time
  // / product's current in_stock flag) — no extra fetch needed here.
  const outOfStockItems = items.filter((i) => !i.product.in_stock || i.maxQty <= 0)

  const subtotal = selected.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  const selectedKeys = () => selected.map((i) => i.key)

  // Desktop (lg+): a banner anchored to the "My Cart" heading. Mobile: a
  // small inline hint anchored right under the icon that was clicked.
  const requireSelection = (icon: 'share' | 'delete' | 'wishlist') => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    if (isDesktop) {
      setShowDesktopHint(true)
      setTimeout(() => setShowDesktopHint(false), 2000)
      return
    }
    setSelectionHint(icon)
    setTimeout(() => setSelectionHint(null), 2000)
  }

  const handleShare = () => {
    if (!hasSelection) { requireSelection('share'); return }
    setShareOpen(true)
  }

  const handleDeleteSelected = () => {
    if (!hasSelection) { requireSelection('delete'); return }
    setConfirmBulkDelete(true)
  }

  const confirmDeleteSelected = () => {
    removeItems(selectedKeys())
    setConfirmBulkDelete(false)
    toast.success(`Removed ${selectedCount} item${selectedCount === 1 ? '' : 's'} from cart`)
  }

  const handleMoveToWishlist = () => {
    if (!hasSelection) { requireSelection('wishlist'); return }
    selected.forEach((i) => wishlistAdd(i.key))
    removeItems(selectedKeys())
    toast.success(`Moved ${selectedCount} item${selectedCount === 1 ? '' : 's'} to wishlist`)
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any sarees yet</p>
          <Link href="/products">
            <Button size="lg">Browse Sarees <ArrowRight className="h-5 w-5" /></Button>
          </Link>
        </div>
      </div>
    )
  }

  // Always enabled/clickable — clicking with nothing selected shows a toast
  // instead of being disabled outright (handled in each handler above).
  const actionBtnClass = 'p-2 rounded-lg text-gray-700 hover:text-rose-700 hover:bg-rose-50 transition-colors'

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
    <div className="container mx-auto px-4 py-8">
      <CheckoutBreadcrumb active="cart" />
      <div className="relative">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cart</h1>
        {showDesktopHint && (
          <div
            className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg"
            style={{ background: '#5A1F2B', color: '#FFF8F2', border: '1px solid #C9A227' }}
          >
            Please select atleast one item
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Out-of-stock notice — right above the selection bar */}
          {outOfStockItems.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="relative flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 text-gray-700" />
                  <AlertCircle className="absolute -top-1.5 -right-1.5 h-3 w-3 text-white fill-red-500" />
                </span>
                Item(s) out of stock.
              </span>
              <button type="button" onClick={() => setShowOutOfStock(true)} className="text-xs font-bold tracking-wide text-rose-700 hover:text-rose-800 transition-colors">
                VIEW
              </button>
            </div>
          )}

          {/* Selection bar — scoped to the items column so the icons line up above the price column, not the far page edge */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">
              <span className="text-rose-700">{selectedCount}</span>/{items.length} Items Selected
              {hasSelection && <span className="text-rose-700 font-bold ml-1">({formatPrice(subtotal)})</span>}
            </span>
            <div className="flex items-center gap-1">
              <div className="relative">
                <button type="button" onClick={handleShare} aria-label="Share selected items" title="Share" className={actionBtnClass}>
                  <Share2 className="h-5 w-5" />
                </button>
                {selectionHint === 'share' && <SelectionHint />}
              </div>
              <div className="relative">
                <button type="button" onClick={handleDeleteSelected} aria-label="Delete selected items" title="Delete" className={actionBtnClass}>
                  <Trash2 className="h-5 w-5" />
                </button>
                {selectionHint === 'delete' && <SelectionHint />}
              </div>
              <div className="relative">
                <button type="button" onClick={handleMoveToWishlist} aria-label="Move selected items to wishlist" title="Move to Wishlist" className={actionBtnClass}>
                  <HeartHandshake className="h-5 w-5" />
                </button>
                {selectionHint === 'wishlist' && <SelectionHint />}
              </div>
            </div>
          </div>

          {items.map((item) => {
            const checked = !deselected.includes(item.key)
            return (
              <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => toggleSelected(item.key)}
                  aria-label={checked ? 'Unselect item' : 'Select item'}
                  aria-pressed={checked}
                  className={`flex-shrink-0 self-start mt-1 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    checked ? 'bg-rose-700 border-rose-700' : 'bg-white border-gray-300'
                  }`}
                >
                  {checked && <Check className="h-3.5 w-3.5 text-white" />}
                </button>

                <div className="relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🥻</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product_id}`}>
                    <h3 className="font-semibold text-gray-900 text-sm hover:text-rose-700 transition-colors line-clamp-2">{toTitleCase(item.product.name)}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 capitalize mt-1">{item.product.fabric} • {item.product.region}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            setConfirmRemove(item)
                            return
                          }
                          updateQuantity(item.key, item.quantity - 1)
                        }}
                        className="px-2 py-1 hover:bg-gray-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => {
                          if (item.quantity >= item.maxQty) {
                            toast.error(`Only ${item.maxQty} in stock`)
                            return
                          }
                          updateQuantity(item.key, item.quantity + 1)
                        }}
                        disabled={item.quantity >= item.maxQty}
                        className="px-2 py-1 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                      <button onClick={() => setConfirmRemove(item)} aria-label="Remove item" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({selectedCount} item{selectedCount === 1 ? '' : 's'})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              {hasSelection && shipping > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                  Add {formatPrice(999 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {hasSelection ? (
              <Link href="/checkout" className="block mt-5">
                <Button className="w-full" size="lg">
                  Proceed to Checkout <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button className="w-full mt-5" size="lg" disabled>
                Proceed to Checkout <ArrowRight className="h-5 w-5" />
              </Button>
            )}

            <Link href="/products" className="block mt-3">
              <Button variant="ghost" className="w-full text-sm">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Remove / move-to-wishlist dialog (single item) */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Move from Bag</h3>
              <button onClick={() => setConfirmRemove(null)} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3 border border-gray-100 rounded-xl p-3 mb-4">
              <div className="relative w-14 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {confirmRemove.image ? (
                  <Image src={confirmRemove.image} alt={confirmRemove.product.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🥻</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{toTitleCase(confirmRemove.product.name)}</p>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{confirmRemove.product.fabric} • {confirmRemove.product.region}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">Are you sure you want to move this item from bag?</p>

            <div className="flex gap-3">
              <button
                onClick={() => { removeItem(confirmRemove.key); setConfirmRemove(null); toast.success('Removed from cart') }}
                className="flex-1 h-11 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => { wishlistAdd(confirmRemove.key); removeItem(confirmRemove.key); setConfirmRemove(null); toast.success('Moved to wishlist') }}
                className="flex-1 h-11 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold transition-colors"
              >
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete-selected confirmation dialog */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmBulkDelete(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Remove {selectedCount} item{selectedCount === 1 ? '' : 's'}</h3>
              <button onClick={() => setConfirmBulkDelete(false)} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove {selectedCount} item{selectedCount === 1 ? '' : 's'} from bag.
            </p>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-center gap-4">
              <button
                onClick={confirmDeleteSelected}
                className="text-sm font-bold tracking-wide text-gray-600 hover:text-gray-900 transition-colors"
              >
                REMOVE
              </button>
              <span className="h-4 w-px bg-gray-200" aria-hidden />
              <button
                onClick={() => {
                  selected.forEach((i) => wishlistAdd(i.key))
                  removeItems(selectedKeys())
                  setConfirmBulkDelete(false)
                  toast.success(`Moved ${selectedCount} item${selectedCount === 1 ? '' : 's'} to wishlist`)
                }}
                className="text-sm font-bold tracking-wide text-rose-700 hover:text-rose-800 transition-colors"
              >
                MOVE TO WISHLIST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share selected items */}
      {shareOpen && (
        <ShareCartModal
          items={selected.map((i) => ({ product_id: i.product_id, image: i.image, quantity: i.quantity }))}
          ownerName={ownerName}
          userId={userId}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Out-of-stock items list */}
      {showOutOfStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowOutOfStock(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Out of stock</h3>
              <button onClick={() => setShowOutOfStock(false)} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {outOfStockItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="relative w-12 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.product.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🥻</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{toTitleCase(item.product.name)}</p>
                    <p className="text-xs text-red-600 font-medium mt-0.5">Out of stock</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
