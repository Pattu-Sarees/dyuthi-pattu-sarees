'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingBag, Check } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/types'
import { formatPrice, getDiscountPercent, toTitleCase } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'

export default function WishlistCard({
  product,
  image,
  onRemove,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  product: Product
  image: string
  onRemove?: () => void
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const displayImage = image || product.images?.[0] || ''
  // Availability for THIS design/colour (the wishlisted image), not the product total.
  const variant = product.color_variants?.find((v) => v.image === displayImage)
  const effectiveStock = variant ? (Number(variant.quantity) || 0) : product.stock_quantity
  const soldOut = effectiveStock <= 0
  const discount = product.original_price ? getDiscountPercent(product.original_price, product.price) : 0

  const moveToBag = () => {
    if (soldOut) {
      toast.error('Sold out', { description: product.name })
      return
    }
    addItem(product, 1, displayImage)
    setAdded(true)
    toast.success('Moved to bag', { description: product.name })
    // Removing from the wishlist mirrors the "move" semantics on the wishlist page.
    setTimeout(() => onRemove?.(), 500)
  }

  const ImageInner = (
    <>
      <div className="absolute inset-0 overflow-hidden rounded-t-lg">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-rose-50 to-amber-50">🥻</div>
        )}
      </div>
      {soldOut && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded">Sold Out</span>
        </div>
      )}
    </>
  )

  return (
    <div
      className={`group relative bg-white rounded-lg border transition-all duration-300 flex flex-col ${
        selectMode && selected ? 'border-[#AD1457] ring-2 ring-[#AD1457]' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      {/* Image */}
      {selectMode ? (
        <button type="button" onClick={onToggleSelect} className="relative aspect-[9/10] bg-gray-100 block w-full text-left">
          {ImageInner}
        </button>
      ) : (
        <Link href={`/products/${product.id}`} className="relative aspect-[9/10] bg-gray-100 block">
          {ImageInner}
        </Link>
      )}

      {/* Selection checkbox — top-right (circular, tick when selected) */}
      {selectMode ? (
        <button
          onClick={onToggleSelect}
          aria-label={selected ? 'Deselect item' : 'Select item'}
          className={`absolute top-2.5 right-2.5 z-10 h-7 w-7 flex items-center justify-center rounded-full border-2 transition-colors ${
            selected ? 'bg-[#AD1457] border-[#AD1457] text-white' : 'bg-white/90 border-gray-300 text-transparent'
          }`}
        >
          <Check className="h-4 w-4" />
        </button>
      ) : (
        onRemove && (
          <button
            onClick={onRemove}
            aria-label="Remove from wishlist"
            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <X className="h-4 w-4 text-[#4E1E24]" />
          </button>
        )
      )}

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {selectMode ? (
          <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem]">{toTitleCase(product.name)}</h3>
        ) : (
          <Link href={`/products/${product.id}`}>
            <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem] hover:text-[#C2185B]">
              {toTitleCase(product.name)}
            </h3>
          </Link>
        )}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-[#C2185B]">{formatPrice(product.price)}</span>
          {product.original_price && (
            <>
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
              {discount > 0 && <span className="text-xs font-semibold text-[#2E8B57]">{discount}% Off</span>}
            </>
          )}
        </div>

        {/* Move to Bag — below the product (hidden while selecting) */}
        {!selectMode && (
          <button
            onClick={moveToBag}
            disabled={soldOut}
            className="mt-auto w-full flex items-center justify-center gap-2 border border-[#AD1457] text-[#AD1457] hover:bg-[#AD1457] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#AD1457] font-semibold text-sm py-2.5 rounded-md transition-colors"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            Move to Bag
          </button>
        )}
      </div>
    </div>
  )
}
