'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { ShoppingBag, Heart, Check, Star, Sparkles, Flame } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, getDiscountPercent, getStockStatus, toTitleCase } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { toast } from 'sonner'

// Colored dots that burst outward from the wishlist heart
const BURST_COLORS = ['#AD1457', '#F4C430', '#1f8a5b', '#C2185B', '#F59E0B', '#AD1457']
const BURST_DOTS = Array.from({ length: 6 }).map((_, i) => {
  const a = (i / 6) * 2 * Math.PI
  const r = 15
  return { tx: `${Math.cos(a) * r}px`, ty: `${Math.sin(a) * r}px`, color: BURST_COLORS[i] }
})

export default function ProductCard({ product, image, imageIndex, isNewArrival, isBestSeller, onlyBadge }: { product: Product; image?: string; imageIndex?: number; isNewArrival?: boolean; isBestSeller?: boolean; onlyBadge?: 'best' | 'new' | 'sale' }) {
  // Per-item flags when provided (each photo can differ), else product-level rollup.
  const showNew = isNewArrival ?? product.is_new_arrival
  const showBestSeller = isBestSeller ?? product.is_best_seller
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggle)

  // When rendered as an individual variant, show/add this specific image.
  const displayImage = image ?? product.images?.[0] ?? ''
  // Unique per displayed item (so only the clicked card turns pink, not all variants)
  const wishKey = displayImage ? `${product.id}::${displayImage}` : product.id
  const wishlisted = useWishlistStore((s) => s.ids.includes(wishKey))

  const [mounted, setMounted] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [burst, setBurst] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])

  // Fly a thumbnail of the product from the button to the header cart icon.
  const flyToCart = () => {
    const start = btnRef.current?.getBoundingClientRect()
    const target = document.getElementById('cart-fly-target')?.getBoundingClientRect()
    if (!start || !target || !displayImage) return
    const size = 44
    const cx = start.left + start.width / 2
    const cy = start.top + start.height / 2
    const fly = document.createElement('div')
    fly.style.cssText = [
      'position:fixed',
      `left:${cx - size / 2}px`,
      `top:${cy - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      'border-radius:9999px',
      `background-image:url("${displayImage}")`,
      'background-size:cover',
      'background-position:center',
      'box-shadow:0 8px 20px rgba(0,0,0,0.35)',
      'border:2px solid #fff',
      'z-index:9999',
      'pointer-events:none',
      'will-change:transform',
      'backface-visibility:hidden',
    ].join(';')
    document.body.appendChild(fly)
    const dx = target.left + target.width / 2 - cx
    const dy = target.top + target.height / 2 - cy
    const anim = fly.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(0.85)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 1 },
      ],
      { duration: 1000, easing: 'cubic-bezier(0.45, 0, 0.35, 1)' }
    )
    anim.onfinish = () => fly.remove()
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    const adding = !wishlisted
    toggleWishlist(wishKey)
    // Track product-level wishlist count (fire-and-forget)
    fetch(`/api/products/${product.id}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: adding ? 1 : -1 }),
    }).catch(() => {})
    if (adding) {
      setHeartBurst(true)
      setTimeout(() => setHeartBurst(false), 600)
    }
    toast.success(adding ? 'Product added to wishlist' : 'Removed from wishlist', { description: product.name })
  }

  const href = imageIndex != null ? `/products/${product.id}?image=${imageIndex}` : `/products/${product.id}`

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    const mainImage = displayImage
    const key = `${product.id}::${mainImage}`
    const inCart = items.find((i) => i.key === key)?.quantity || 0
    const max = product.color_variants?.find((v) => v.image === mainImage)?.quantity ?? product.stock_quantity
    if (inCart >= max) {
      toast.error(`Only ${max} in stock`, { description: product.name })
      return
    }
    addItem(product, 1, mainImage)
    // Sequence: dots burst → check mark + fly to cart → message → back to bag
    setBurst(true)
    setTimeout(() => {
      setBurst(false)
      setJustAdded(true)
      flyToCart()
    }, 280)
    setTimeout(() => toast.success('Added to cart', { description: product.name }), 1300)
    setTimeout(() => setJustAdded(false), 1600)
  }

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  const stock = getStockStatus(product.stock_quantity)

  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[9/10] bg-gray-100">
          {/* Inner clip keeps the image (and hover-zoom) rounded; the wrapper stays overflow-visible so the fly animation can escape upward */}
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
              <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-rose-50 to-amber-50">
                🥻
              </div>
            )}
          </div>
          {/* Single badge overlay — used by the dropdown sections & their View-All pages,
              where only one badge type applies at a time. Placed top-left on the image. */}
          {onlyBadge === 'best' && showBestSeller && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 whitespace-nowrap rounded bg-[#B8860B] text-white text-[10px] font-bold px-2 py-1 tracking-wide shadow-sm">
              <Star className="h-3 w-3 fill-current flex-shrink-0" /> BEST SELLER
            </span>
          )}
          {onlyBadge === 'new' && showNew && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 whitespace-nowrap rounded bg-[#2E8B57] text-white text-[10px] font-bold px-2 py-1 tracking-wide shadow-sm">
              <Sparkles className="h-3 w-3 flex-shrink-0" /> NEW
            </span>
          )}
          {onlyBadge === 'sale' && discount > 0 && (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 whitespace-nowrap rounded bg-[#C73B75] text-white text-[10px] font-bold px-2 py-1 tracking-wide shadow-sm">
              <Flame className="h-3 w-3 fill-current flex-shrink-0" /> ON SALE
            </span>
          )}
          {stock.level === 'low' && (
            <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">LOW STOCK</span>
          )}
          {stock.level === 'out' && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded">Sold Out</span>
            </div>
          )}
          {/* Wishlist — top-right */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 right-2.5 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Heart className={`h-4 w-4 transition-colors ${heartBurst ? 'animate-heart' : ''} ${mounted && wishlisted ? 'text-[#AD1457] fill-[#AD1457]' : 'text-[#4E1E24]'}`} />
            {heartBurst && (
              <span className="pointer-events-none absolute inset-0">
                {BURST_DOTS.map((d, i) => (
                  <span
                    key={i}
                    className="dot-burst absolute left-1/2 top-1/2 h-1.5 w-1.5 -ml-[3px] -mt-[3px] rounded-full"
                    style={{ ['--tx' as string]: d.tx, ['--ty' as string]: d.ty, backgroundColor: d.color } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
          </button>

          {/* Add to Bag — bottom-right on the image, expands to a pill on hover */}
          {stock.level !== 'out' && (
            <button
              ref={btnRef}
              onClick={handleAddToCart}
              aria-label="Add to bag"
              className="group/add absolute bottom-2.5 right-2.5 flex items-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors p-2.5"
            >
              {justAdded ? (
                <Check className="h-4 w-4 text-[#4E1E24] animate-pop" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-[#4E1E24]" />
              )}
              {/* Dots burst on click */}
              {burst && (
                <span className="pointer-events-none absolute inset-0">
                  {BURST_DOTS.map((d, i) => (
                    <span
                      key={i}
                      className="dot-burst absolute left-1/2 top-1/2 h-1.5 w-1.5 -ml-[3px] -mt-[3px] rounded-full"
                      style={{ ['--tx' as string]: d.tx, ['--ty' as string]: d.ty, backgroundColor: d.color } as React.CSSProperties}
                    />
                  ))}
                </span>
              )}
              {!burst && !justAdded && (
                <span className="max-w-0 group-hover/add:max-w-[44px] group-hover/add:ml-1.5 overflow-hidden whitespace-nowrap text-xs font-semibold text-[#4E1E24] transition-all duration-200">
                  Add
                </span>
              )}
            </button>
          )}

        </div>

        {/* Badges — combined bar flush under the image (all applicable badges).
            Skipped when onlyBadge is set: those sections show a single top-left overlay instead. */}
        {!onlyBadge && (() => {
          const badgeBest = showBestSeller
          const badgeNew = showNew
          const badgeSale = discount > 0
          if (!badgeBest && !badgeNew && !badgeSale) return null
          return (
            <div className="flex w-fit max-w-full overflow-hidden">
              {badgeBest && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap bg-[#B8860B] text-white text-[10px] font-bold px-2 py-1 tracking-wide">
                  <Star className="h-3 w-3 fill-current flex-shrink-0" /> BEST SELLER
                </span>
              )}
              {badgeNew && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap bg-[#2E8B57] text-white text-[10px] font-bold px-2 py-1 tracking-wide">
                  <Sparkles className="h-3 w-3 flex-shrink-0" /> NEW
                </span>
              )}
              {badgeSale && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap bg-[#C73B75] text-white text-[10px] font-bold px-2 py-1 tracking-wide">
                  <Flame className="h-3 w-3 fill-current flex-shrink-0" /> ON SALE
                </span>
              )}
            </div>
          )
        })()}

        {/* Info */}
        <div className="p-3">
          <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem]">{toTitleCase(product.name)}</h3>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#C2185B]">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
