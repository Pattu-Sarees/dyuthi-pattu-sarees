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

export default function ProductCard({
  product,
  image,
  imageIndex,
  isNewArrival,
  isBestSeller,
  onlyBadge,
  variant = 'grid',
}: {
  product: Product
  image?: string
  imageIndex?: number
  isNewArrival?: boolean
  isBestSeller?: boolean
  onlyBadge?: 'best' | 'new' | 'sale'
  // 'list' renders as a wide horizontal row on desktop (lg+) when the 1-per-row
  // list view is selected; it always falls back to the normal card on mobile.
  variant?: 'grid' | 'list'
}) {
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
  const listBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])

  // Fly a thumbnail of the product from the button to the header cart icon.
  // `onLanded` fires once the thumbnail actually reaches the cart icon — the
  // cart count shouldn't tick up before the animation visually gets there.
  const flyToCart = (fromRef: React.RefObject<HTMLButtonElement | null>, onLanded?: () => void) => {
    const start = fromRef.current?.getBoundingClientRect()
    const target = document.getElementById('cart-fly-target')?.getBoundingClientRect()
    if (!start || !target || !displayImage) {
      onLanded?.()
      return
    }
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
    anim.onfinish = () => {
      fly.remove()
      onLanded?.()
    }
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

  const handleAddToCart = (e: React.MouseEvent, fromRef: React.RefObject<HTMLButtonElement | null>) => {
    e.preventDefault()
    const mainImage = displayImage
    const key = `${product.id}::${mainImage}`
    const inCart = items.find((i) => i.key === key)?.quantity || 0
    const max = product.color_variants?.find((v) => v.image === mainImage)?.quantity ?? product.stock_quantity
    if (inCart >= max) {
      toast.error(`Only ${max} in stock`, { description: product.name })
      return
    }
    // Sequence: dots burst → check mark + fly to cart → THEN bump the cart
    // count/message once the thumbnail actually lands → back to bag icon.
    setBurst(true)
    setTimeout(() => {
      setBurst(false)
      setJustAdded(true)
      flyToCart(fromRef, () => {
        addItem(product, 1, mainImage)
        toast.success('Added to cart', { description: product.name })
      })
    }, 280)
    setTimeout(() => setJustAdded(false), 1600)
  }

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  const stock = getStockStatus(product.stock_quantity)

  // Badges shown as an overlay on the image (top-left) — shared by both layouts.
  const imageBadges = (
    <>
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
    </>
  )

  // Combined badge bar flush under the image — grid layout only.
  const badgeBar = !onlyBadge && (() => {
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
  })()

  // Standard vertical card — used for grid views, and for mobile even when
  // the desktop list view is active.
  const gridCard = (
    <div className="group relative bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer h-full max-lg:flex max-lg:flex-col">
      {/* Image */}
      <div className="relative aspect-[9/10] bg-gray-100">
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
        {imageBadges}
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
            onClick={(e) => handleAddToCart(e, btnRef)}
            aria-label="Add to bag"
            className="group/add absolute bottom-2.5 right-2.5 flex items-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors p-2.5"
          >
            {justAdded ? (
              <Check className="h-4 w-4 text-[#4E1E24] animate-pop" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-[#4E1E24]" />
            )}
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

      {badgeBar}

      {/* Info — pinned to the bottom on mobile so name/price align across a row
          even when some cards carry a BEST SELLER badge bar. */}
      <div className="p-3 max-lg:mt-auto">
        <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem]">{toTitleCase(product.name)}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-[#C2185B]">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
      </div>
    </div>
  )

  // Wide horizontal row — desktop List view only.
  const listRow = (
    <div className="group bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
      <div className="flex items-stretch gap-5 p-3">
      {/* Image */}
      <div className="relative w-56 flex-shrink-0 aspect-square bg-gray-100 rounded-md overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-rose-50 to-amber-50">
            🥻
          </div>
        )}
        {imageBadges}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-2">
        <h3 className="text-gray-800 text-lg font-medium leading-snug line-clamp-2 mb-2">{toTitleCase(product.name)}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-[#C2185B]">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {stock.level !== 'out' ? (
            <button
              ref={listBtnRef}
              onClick={(e) => handleAddToCart(e, listBtnRef)}
              className="relative flex items-center justify-center gap-2 border border-gray-300 rounded-md px-6 py-2.5 text-sm font-semibold text-gray-800 hover:border-gray-800 transition-colors overflow-hidden"
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4 animate-pop" /> Added
                </>
              ) : (
                'Add to Bag'
              )}
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
            </button>
          ) : (
            <span className="text-sm font-semibold text-gray-500 border border-gray-200 rounded-md px-6 py-2.5">Sold Out</span>
          )}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="relative flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 hover:border-gray-800 transition-colors"
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
        </div>
      </div>
      </div>
      {badgeBar}
    </div>
  )

  return (
    <Link href={href}>
      {variant === 'list' ? (
        <>
          <div className="lg:hidden h-full">{gridCard}</div>
          <div className="hidden lg:block">{listRow}</div>
        </>
      ) : (
        gridCard
      )}
    </Link>
  )
}
