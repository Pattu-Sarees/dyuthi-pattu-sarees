'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, ChevronRight, ChevronLeft, Minus, Plus, RefreshCw, Gem, CreditCard, Timer, BadgeCheck, ClipboardList, Truck, Share2, Link2, Mail, X, ZoomIn, PlayCircle } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, formatDate, getDiscountPercent, getStockStatus, toTitleCase } from '@/lib/utils'
import { colorNameToHex } from '@/lib/color-blend'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import ReviewForm from '@/components/reviews/ReviewForm'
import VideoPlayer from '@/components/products/VideoPlayer'

// Approved review shape mapped from the unified review store (testimonials table)
export interface ProductReview {
  id: string
  user_name: string
  rating: number
  title: string | null
  comment: string
  images: string[]
  verified: boolean
  created_at: string
}

// Brand icons (not available in lucide-react)
const brandIcon = (path: string) => {
  const Icon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  )
  return Icon
}
const InstagramIcon = brandIcon('M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z')
const WhatsAppIcon = brandIcon('M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z')
const FacebookIcon = brandIcon('M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z')
const TwitterIcon = brandIcon('M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z')
const PinterestIcon = brandIcon('M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.966 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z')

function ShareMenu({ productName }: { productName: string }) {
  const [open, setOpen] = useState(false)
  const [nativeShare, setNativeShare] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // On phones with the Web Share API, share via the native OS sheet instead of the modal.
  useEffect(() => {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    setNativeShare(isMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(pageUrl)
  const encodedText = encodeURIComponent(`Check out ${productName} on Dyuthi Pattu Sarees`)

  const handleShareClick = async () => {
    if (nativeShare) {
      try {
        await navigator.share({ title: productName, text: `Check out ${productName} on Dyuthi Pattu Sarees`, url: pageUrl })
      } catch {
        /* user dismissed the share sheet — no-op */
      }
      return
    }
    setOpen(true)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const shareLinks = [
    { label: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/', copyFirst: true },
    { label: 'WhatsApp', icon: WhatsAppIcon, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { label: 'Facebook', icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'Twitter', icon: TwitterIcon, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { label: 'Gmail', icon: Mail, href: `https://mail.google.com/mail/?view=cm&su=${encodedText}&body=${encodedUrl}` },
    { label: 'Pinterest', icon: PinterestIcon, href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}` },
  ]

  return (
    <div className="flex-shrink-0">
      <button
        type="button"
        onClick={handleShareClick}
        className="h-10 w-10 mt-1 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#C2185B] hover:border-rose-300 transition-colors"
        aria-label="Share product"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div role="dialog" aria-label="Share product" className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Copy link</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Close share dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={pageUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                onClick={copyLink}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#C2185B] text-white text-sm font-medium hover:bg-[#a3134c] transition-colors"
              >
                <Link2 className="h-4 w-4" /> Copy
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-900 mb-3">Share:</p>
            <div className="flex items-center gap-5 flex-wrap">
              {shareLinks.map(({ label, icon: Icon, href, copyFirst }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  aria-label={`Share on ${label}`}
                  onClick={() => {
                    if (copyFirst) navigator.clipboard?.writeText(pageUrl).then(() => toast.success('Link copied — paste it in your story or DM!')).catch(() => {})
                  }}
                  className="text-gray-800 hover:text-[#C2185B] transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Returns a YouTube embed URL if the link is a YouTube video, else null.
function youTubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export default function ProductDetail({ product, reviews }: { product: Product; reviews: ProductReview[] }) {
  const searchParams = useSearchParams()
  const initialImage = Math.min(
    Math.max(0, Number(searchParams.get('image')) || 0),
    Math.max(0, (product.images?.length || 1) - 1)
  )
  const [selectedImage, setSelectedImage] = useState(initialImage)
  // Which angle shot of the current item is shown (0 = the main photo)
  const [selectedAngle, setSelectedAngle] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Extra angle photos of the currently selected item (from its colour variant)
  const currentVariant = product.color_variants?.find((v) => v.image === product.images?.[selectedImage])
  const angles = [product.images?.[selectedImage], ...(currentVariant?.additional_images || [])].filter(Boolean) as string[]
  const displayedImage = angles[selectedAngle] || product.images?.[selectedImage]

  // Pieces available for the SELECTED design (variant). null = product has no
  // per-colour variants, so it falls back to the total stock.
  const variantPieces = currentVariant ? Math.max(0, Number(currentVariant.quantity) || 0) : null
  const maxForItem = variantPieces ?? product.stock_quantity
  const itemAvailable = maxForItem > 0

  // Switching to a different design resets the quantity so it can't exceed that
  // design's pieces (e.g. carrying 5 over to a design with only 1 left).
  useEffect(() => { setQuantity(1) }, [selectedImage])

  const goToImage = (idx: number) => { setSelectedImage(idx); setSelectedAngle(0) }

  // Gallery slides = images + (video as the LAST slide, played inline).
  const [videoActive, setVideoActive] = useState(false)
  const hasVideo = !!product.video_url
  const imgCount = product.images?.length || 0
  const slideCount = imgCount + (hasVideo ? 1 : 0)
  const currentSlide = videoActive ? imgCount : selectedImage
  const goToSlide = (idx: number) => {
    if (slideCount === 0) return
    const i = ((idx % slideCount) + slideCount) % slideCount
    if (hasVideo && i === imgCount) setVideoActive(true)
    else { setVideoActive(false); goToImage(i) }
  }
  // "Watch Saree Video" → jump the gallery to the video slide and scroll it into view.
  const openVideoSlide = () => {
    setVideoActive(true)
    setTimeout(() => imageBoxRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0)
  }

  // Cursor-following zoom — armed by clicking the magnifier, disarmed by clicking outside the image
  const [zoomMode, setZoomMode] = useState(false)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const imageBoxRef = useRef<HTMLDivElement>(null)
  // Full-size preview popup (click on image)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPreview(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

  // Clicking/tapping anywhere outside the image stops zoom mode and brings the magnifier back
  useEffect(() => {
    if (!zoomMode) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (imageBoxRef.current && !imageBoxRef.current.contains(e.target as Node)) {
        setZoomMode(false)
        setZoom(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [zoomMode])
  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }
  // Touch equivalent of the cursor-following zoom (mobile): pan while a finger is
  // down, and return to normal when the finger lifts.
  const handleZoomTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    if (!t) return
    const rect = e.currentTarget.getBoundingClientRect()
    setZoom({
      x: ((t.clientX - rect.left) / rect.width) * 100,
      y: ((t.clientY - rect.top) / rect.height) * 100,
    })
  }
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'shipping'>('details')
  const addItem = useCartStore((s) => s.addItem)

  const openReviewForm = () => {
    setShowReviewForm(true)
    setTimeout(() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // Count a product view (fire-and-forget, once per mount)
  useEffect(() => {
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {})
  }, [product.id])

  const discount = product.original_price
    ? getDiscountPercent(product.original_price, product.price)
    : 0

  const stock = getStockStatus(product.stock_quantity)
  const available = stock.level !== 'out'

  const handleAddToCart = () => {
    addItem(product, quantity, product.images[selectedImage])
    toast.success('Added to cart!', { description: `${quantity}x ${toTitleCase(product.name)}` })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-rose-600">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-rose-600">Sarees</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 capitalize">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-10">
        {/* Images */}
        <div className="space-y-3 lg:col-span-2 lg:sticky lg:top-24 self-start">
          <div className="flex gap-3">
            {/* Angle thumbnails — only when this item has additional photos */}
            {angles.length > 1 && (
              <div className="flex flex-col gap-2 overflow-y-auto flex-shrink-0">
                {angles.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setSelectedAngle(idx)}
                    className={`relative w-14 h-[4.5rem] rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedAngle === idx ? 'border-[#C2185B]' : 'border-gray-200 hover:border-rose-300'
                    }`}
                    aria-label={idx === 0 ? 'Main photo' : `Angle ${idx}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                  </button>
                ))}
              </div>
            )}

            <div
              ref={imageBoxRef}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 group flex-1 ${videoActive ? '' : zoomMode ? 'cursor-zoom-in touch-none' : 'cursor-pointer'}`}
              onMouseMove={!videoActive && zoomMode && displayedImage ? handleZoomMove : undefined}
              onMouseLeave={() => setZoom(null)}
              onTouchStart={!videoActive && zoomMode && displayedImage ? handleZoomTouch : undefined}
              onTouchMove={!videoActive && zoomMode && displayedImage ? handleZoomTouch : undefined}
              onTouchEnd={() => { setZoom(null); setZoomMode(false) }}
              onTouchCancel={() => { setZoom(null); setZoomMode(false) }}
              onClick={() => !videoActive && !zoomMode && displayedImage && setPreview(true)}
            >
              {videoActive && product.video_url ? (
                /* Video plays inline as the last gallery slide */
                <div className="absolute inset-0 flex items-center justify-center bg-black" onClick={(e) => e.stopPropagation()}>
                  {youTubeEmbed(product.video_url) ? (
                    <iframe
                      src={`${youTubeEmbed(product.video_url)!}?autoplay=1`}
                      title={`${product.name} video`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <VideoPlayer src={product.video_url} title={`${product.name} video`} watermark={product.video_watermark || undefined} fill />
                  )}
                </div>
              ) : displayedImage ? (
                <Image
                  src={displayedImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-150 ease-out"
                  style={zoomMode && zoom ? { transform: 'scale(1.5)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🥻</div>
              )}
              {/* Magnifier — click to start zooming; hidden while zoom is active or on video */}
              {!videoActive && displayedImage && !zoomMode && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setZoomMode(true) }}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-600 hover:text-[#C2185B] hover:bg-white transition-colors"
                  aria-label="Zoom image"
                  title="Zoom"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              )}
              {/* Mini indicator while zooming */}
              {displayedImage && zoomMode && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/80 shadow flex items-center justify-center text-[#C2185B] pointer-events-none" aria-hidden>
                  <ZoomIn className="h-3.5 w-3.5" />
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 bg-green-500 text-white border-0 text-[10px] sm:text-xs px-1.5 py-0.5">{discount}% OFF</Badge>
              )}

              {slideCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToSlide(currentSlide - 1) }}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-10 sm:w-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#C2185B] transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goToSlide(currentSlide + 1) }}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 sm:h-10 sm:w-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#C2185B] transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 z-10 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {currentSlide + 1} / {slideCount}
                  </div>
                </>
              )}
            </div>
          </div>
          {slideCount > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    !videoActive && selectedImage === idx ? 'border-rose-600' : 'border-transparent'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
              {/* Video as the LAST gallery item — plays inline in the gallery on tap */}
              {hasVideo && (
                <button
                  onClick={() => goToSlide(imgCount)}
                  aria-label="Watch saree video"
                  className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 bg-black transition-colors ${
                    videoActive ? 'border-rose-600' : 'border-transparent'
                  }`}
                >
                  {product.images?.[0] && <Image src={product.images[0]} alt="" fill className="object-cover opacity-50" sizes="64px" />}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-7 w-7 text-white drop-shadow" />
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Watch Saree Video — jumps the gallery to the inline video slide */}
          {hasVideo && (
            <button
              onClick={openVideoSlide}
              className="inline-flex items-center gap-1.5 text-base font-bold text-[#C2185B] underline underline-offset-2 hover:no-underline"
            >
              <PlayCircle className="h-5 w-5" /> Watch Saree Video
            </button>
          )}

          {/* Full-size image preview popup — portaled to <body> so nothing overlaps it */}
          {preview && displayedImage && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
              onClick={(e) => e.target === e.currentTarget && setPreview(false)}
            >
              <div className="relative w-full max-w-3xl h-[85vh]">
                <Image src={displayedImage} alt={product.name} fill className="object-contain" sizes="90vw" />
                <button
                  onClick={() => setPreview(false)}
                  className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-800 hover:text-[#C2185B] transition-colors"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>,
            document.body
          )}

        </div>

        {/* Info */}
        <div className="space-y-5 lg:col-span-3">
          {/* Title → review → price/stock kept tight together at the top */}
          <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Editorial kicker — category · fabric */}
              {(product.category || product.fabric) && (
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9A8C86] mb-1.5">
                  {[product.category, product.fabric].filter(Boolean).join(' · ')}
                </p>
              )}
              <h1
                className="text-[32px] md:text-[48px] -mt-1.5"
                style={{
                  fontFamily: 'var(--font-cormorant-garamond)',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: '-0.5px',
                  color: '#4E1E24',
                }}
              >
                {toTitleCase(product.name)}
              </h1>
            </div>
            <ShareMenu productName={toTitleCase(product.name)} />
          </div>

          {/* Rating + write a review — kept subtle so it doesn't compete with the title */}
          {(() => {
            // Prefer the live approved reviews; fall back to the stored column
            // for seeded products that have a rating but no review rows loaded.
            const rated = reviews.map((r) => r.rating).filter(Boolean)
            const reviewCount = reviews.length || product.review_count || 0
            const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : (product.rating || 0)
            return (
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const fill = Math.max(0, Math.min(1, avgRating - (i - 1))) // 0..1 per star
                    return (
                      <span key={i} className="relative inline-block h-3.5 w-3.5">
                        <Star className="absolute inset-0 h-3.5 w-3.5 fill-none text-gray-300" />
                        {fill > 0 && (
                          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <Star className="h-3.5 w-3.5 fill-[#D4A72C] text-[#D4A72C]" />
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
                <span className="text-gray-500">
                  {reviewCount > 0 ? `${avgRating.toFixed(1)} · ${reviewCount} review${reviewCount > 1 ? 's' : ''}` : 'No reviews yet'}
                </span>
                <span className="text-gray-300">·</span>
                <button onClick={openReviewForm} className="text-gray-500 hover:text-[#7A1F3D] underline underline-offset-2">
                  Write a review
                </button>
              </div>
            )
          })()}

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
          </div>

          {/* Stock + per-design pieces — one compact status row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              stock.level === 'in' ? 'bg-green-50 text-green-700' : stock.level === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                stock.level === 'in' ? 'bg-green-500' : stock.level === 'low' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              {stock.level === 'out'
                ? 'Sold Out'
                : `${stock.label} (${product.stock_quantity} left)`}
            </div>
            {/* Per-design availability — soft pill, updates as designs change */}
            {variantPieces != null && stock.level !== 'out' && (
              <>
                {variantPieces < 1 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium animate-blink"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                  >
                    📦 Sold Out
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                    style={{ backgroundColor: '#FFF4E5', color: '#7A1F3D' }}
                  >
                    📦 {variantPieces} Piece{variantPieces === 1 ? '' : 's'} Available
                  </span>
                )}
              </>
            )}
          </div>

          {/* Code + Colour of the selected design */}
          {(product.code || currentVariant?.color) && (
            <div className="text-sm space-y-1">
              {product.code && (
                <p>
                  <span className="text-gray-800">Code: </span>
                  <span className="font-medium text-[#B8860B]">
                    {product.code}{currentVariant?.color ? `-${currentVariant.color}` : ''}
                  </span>
                </p>
              )}
              {currentVariant?.color && (
                <p>
                  <span className="text-gray-800">Color: </span>
                  <span className="text-gray-800">{currentVariant.color}</span>
                </p>
              )}
            </div>
          )}
          {/* Colour swatch — its own block row so spacing is equal above & below */}
          {currentVariant?.color && (
            <div>
              <span
                className="block h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: colorNameToHex(currentVariant.color) || '#e5e7eb' }}
                title={currentVariant.color}
              />
            </div>
          )}

          {/* Tags — only when the product has occasions */}
          {(product.occasion?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.occasion.map((occ) => (
                <Badge key={occ} variant="secondary" className="capitalize">{occ}</Badge>
              ))}
            </div>
          )}

          {/* Quantity + Cart */}
          {available && itemAvailable && (
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
                  onClick={() => setQuantity(Math.min(maxForItem, quantity + 1))}
                  disabled={quantity >= maxForItem}
                  className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 bg-[#C2185B] hover:bg-[#a3134c]">
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
            </div>
          )}
          {/* This design is sold out even though other designs remain in stock */}
          {available && !itemAvailable && (
            <Button size="lg" disabled className="w-full bg-gray-300 text-white cursor-not-allowed">
              <ShoppingCart className="h-5 w-5" /> Item Sold Out
            </Button>
          )}

          <Link href={available && itemAvailable ? '/checkout' : '#'} onClick={() => available && itemAvailable && addItem(product, quantity, product.images[selectedImage])}>
            <Button size="lg" variant="outline" className="w-full mt-0" disabled={!available || !itemAvailable}>
              Buy Now
            </Button>
          </Link>

          {/* Trust badges */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-4">
            {[
              { icon: Timer, text: 'Fast delivery' },
              { icon: CreditCard, text: 'Secure payments' },
              { icon: Gem, text: '100% quality' },
              { icon: RefreshCw, text: 'Free returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-2 sm:gap-2.5 text-center">
                <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-[#C2185B]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#C2185B]" />
                </div>
                <span className="text-[11px] leading-tight sm:text-sm text-gray-900 font-semibold">{text}</span>
              </div>
            ))}
          </div>

          {/* Estimated delivery */}
          <div className="flex items-center gap-3 bg-[#F5EFE6] rounded-xl px-4 py-3.5">
            <span className="text-xl" aria-hidden>🚚</span>
            <span className="text-sm font-semibold text-gray-900">Estimated Delivery 3–5 Business Days</span>
          </div>

          {/* Tabs: Product Details / Shipping and Return */}
          <div className="pt-2">
            <div className="flex border-b border-gray-200">
              {([
                { key: 'details', label: 'Product Details', icon: ClipboardList },
                { key: 'shipping', label: 'Shipping and Return', icon: Truck },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === key
                      ? 'border-[#C2185B] text-[#C2185B]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {activeTab === 'details' ? (
              <div className="pt-5 space-y-5">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    {[
                      ['Category', product.category],
                      ['Fabric', product.fabric],
                      ['Region', product.region],
                      ['Occasion', product.occasion?.join(', ')],
                      ['Colors', product.color?.join(', ')],
                    ].map(([label, value]) => value && (
                      <div key={label} className="flex text-sm border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-500 w-32 flex-shrink-0 capitalize bg-gray-50 px-4 py-2.5">{label}</span>
                        <span className="text-gray-900 capitalize px-4 py-2.5">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-5 space-y-4 text-sm text-gray-600 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping:</h3>
                  <p>Free shipping across India. Orders are dispatched within 1–3 business days and typically delivered within 3–5 business days. Tracking details will be shared once your order is shipped.</p>
                  <p className="mt-2">For more information please visit <Link href="/shipping-policy" className="font-semibold text-[#C2185B] hover:underline">Shipping Policy</Link>.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Returns &amp; Exchanges:</h3>
                  <p>Returns or exchanges can be requested within 72 hours of delivery for damaged or incorrect products only. An unboxing video is required for verification. Products must be unused and returned in their original condition.</p>
                  <p className="mt-2">For more information please visit <Link href="/refund-policy" className="font-semibold text-[#C2185B] hover:underline">Refund Policy</Link>.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews-section" className="mt-16 scroll-mt-28">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
          {!showReviewForm && (
            <Button onClick={openReviewForm} variant="outline" className="border-[#C2185B] text-[#C2185B] hover:bg-rose-50">
              Write a Review
            </Button>
          )}
        </div>

        {showReviewForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 max-w-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Review {toTitleCase(product.name)}</h3>
            <ReviewForm source="Product Page" productId={product.id} onCancel={() => setShowReviewForm(false)} />
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{review.user_name}</p>
                      {review.verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          <BadgeCheck className="h-3 w-3" /> Verified Buyer
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Customer Review</span>
                      )}
                    </div>
                    <div className="flex mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                </div>
                {review.title && <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>}
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <a key={img} href={img} target="_blank" rel="noopener noreferrer" className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={img} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !showReviewForm && (
          <p className="text-sm text-gray-500">No reviews yet — be the first to share your experience.</p>
        )}
      </div>
    </div>
  )
}
