'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, getDiscountPercent, getStockStatus } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    const mainImage = product.images?.[0] || ''
    const key = `${product.id}::${mainImage}`
    const inCart = items.find((i) => i.key === key)?.quantity || 0
    const max = product.color_variants?.find((v) => v.image === mainImage)?.quantity ?? product.stock_quantity
    if (inCart >= max) {
      toast.error(`Only ${max} in stock`, { description: product.name })
      return
    }
    addItem(product)
    toast.success('Added to cart', { description: product.name })
  }

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  const stock = getStockStatus(product.stock_quantity)

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-rose-50 to-amber-50">
              🥻
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-0 left-0 flex flex-col">
            {discount > 0 && (
              <span className="bg-[#C2185B] text-white text-[11px] font-bold px-2.5 py-1 tracking-wide">SALE</span>
            )}
            {product.is_new_arrival && discount === 0 && (
              <span className="bg-[#1f8a5b] text-white text-[11px] font-bold px-2.5 py-1 tracking-wide">NEW</span>
            )}
          </div>
          {stock.level === 'low' && (
            <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">LOW STOCK</span>
          )}
          {stock.level === 'out' && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded">Sold Out</span>
            </div>
          )}
          <button className="absolute top-2.5 right-2.5 p-1.5 bg-white/85 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50">
            <Heart className="h-4 w-4 text-gray-500 hover:text-[#C2185B]" />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem]">{product.name}</h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.review_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-[#C2185B]">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={stock.level === 'out'}
            className="w-full flex items-center justify-center gap-1.5 border border-[#C2185B] text-[#C2185B] hover:bg-[#C2185B] hover:text-white font-semibold text-sm py-2 rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wide"
          >
            <ShoppingCart className="h-4 w-4" />
            {stock.level === 'out' ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </Link>
  )
}
