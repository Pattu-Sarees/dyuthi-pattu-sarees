'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    toast.success('Added to cart', { description: product.name })
  }

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
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
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="bg-green-500 text-white border-0 text-xs">{discount}% OFF</Badge>
            )}
            {product.is_new_arrival && (
              <Badge className="bg-blue-500 text-white border-0 text-xs">New</Badge>
            )}
            {!product.in_stock && (
              <Badge className="bg-gray-500 text-white border-0 text-xs">Out of Stock</Badge>
            )}
          </div>
          <button className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50">
            <Heart className="h-4 w-4 text-gray-500 hover:text-rose-600" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-rose-600 font-medium mb-1 capitalize">{product.fabric} • {product.region}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">{product.name}</h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.review_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            size="sm"
            className="w-full"
            variant={product.in_stock ? 'default' : 'outline'}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </Link>
  )
}
