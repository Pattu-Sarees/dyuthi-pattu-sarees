'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, ChevronRight, ChevronLeft, Minus, Plus, Shield, Truck, RefreshCw, Share2 } from 'lucide-react'
import { Product, Review } from '@/types'
import { formatPrice, formatDate, getDiscountPercent, getStockStatus } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ProductDetail({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  const stock = getStockStatus(product.stock_quantity)
  const available = stock.level !== 'out'

  const handleAddToCart = () => {
    addItem(product, quantity, product.images[selectedImage])
    toast.success('Added to cart!', { description: `${quantity}x ${product.name}` })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-rose-600">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-rose-600">Sarees</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 capitalize">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 group">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🥻</div>
            )}
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-green-500 text-white border-0">{discount}% OFF</Badge>
            )}

            {product.images?.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedImage((selectedImage - 1 + product.images.length) % product.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#C2185B] transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage((selectedImage + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#C2185B] transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {selectedImage + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-rose-600' : 'border-transparent'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-rose-600 font-medium capitalize mb-1">{product.fabric} • {product.region}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded-md items-center gap-1">
                {product.rating} <Star className="h-3.5 w-3.5 fill-white" />
              </div>
              <span className="text-sm text-gray-500">{product.review_count} verified reviews</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.original_price && (
              <>
                <span className="text-lg text-gray-400 line-through mb-0.5">{formatPrice(product.original_price)}</span>
                <Badge className="bg-green-100 text-green-800 border-0 mb-0.5">{discount}% off</Badge>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.occasion?.map((occ) => (
              <Badge key={occ} variant="secondary" className="capitalize">{occ}</Badge>
            ))}
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 text-sm font-medium ${
            stock.level === 'in' ? 'text-green-600' : stock.level === 'low' ? 'text-amber-600' : 'text-red-500'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              stock.level === 'in' ? 'bg-green-500' : stock.level === 'low' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            {stock.level === 'out'
              ? 'Sold Out'
              : `${stock.label} (${product.stock_quantity} left)`}
          </div>

          {/* Quantity + Cart */}
          {available && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1">
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
            </div>
          )}

          <Link href={available ? '/checkout' : '#'} onClick={() => available && addItem(product, quantity, product.images[selectedImage])}>
            <Button size="lg" variant="outline" className="w-full mt-0" disabled={!available}>
              Buy Now
            </Button>
          </Link>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Shield, text: 'Handloom Certified' },
              { icon: Truck, text: 'Free Shipping ₹999+' },
              { icon: RefreshCw, text: '7-Day Returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                <Icon className="h-5 w-5 text-rose-600" />
                <span className="text-xs text-gray-600 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Details */}
          <div className="bg-rose-50 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
            {[
              ['Category', product.category],
              ['Fabric', product.fabric],
              ['Region', product.region],
              ['Occasion', product.occasion?.join(', ')],
              ['Colors', product.color?.join(', ')],
            ].map(([label, value]) => value && (
              <div key={label} className="flex gap-3 text-sm">
                <span className="text-gray-500 w-24 flex-shrink-0 capitalize">{label}</span>
                <span className="text-gray-900 capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.user_name}</p>
                    <div className="flex mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
