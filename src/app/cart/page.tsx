'use client'

import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; name: string } | null>(null)

  const subtotal = totalPrice()
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any sarees yet</p>
        <Link href="/products">
          <Button size="lg">Browse Sarees <ArrowRight className="h-5 w-5" /></Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
              <div className="relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                {item.image ? (
                  <Image src={item.image} alt={item.product.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🥻</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product_id}`}>
                  <h3 className="font-semibold text-gray-900 text-sm hover:text-rose-700 transition-colors line-clamp-2">{item.product.name}</h3>
                </Link>
                <p className="text-xs text-gray-500 capitalize mt-1">{item.product.fabric} • {item.product.region}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          setConfirmRemove({ key: item.key, name: item.product.name })
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
                    <button onClick={() => setConfirmRemove({ key: item.key, name: item.product.name })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 transition-colors">
            Clear all items
          </button>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                  Add {formatPrice(999 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block mt-5">
              <Button className="w-full" size="lg">
                Proceed to Checkout <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/products" className="block mt-3">
              <Button variant="ghost" className="w-full text-sm">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Remove confirmation dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove product?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Do you want to remove <span className="font-medium">{confirmRemove.name}</span> from your cart?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 h-11 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { removeItem(confirmRemove.key); setConfirmRemove(null); toast.success('Removed from cart') }}
                className="flex-1 h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
