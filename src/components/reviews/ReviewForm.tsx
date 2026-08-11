'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { Star, Loader2, ImagePlus, X, CheckCircle2 } from 'lucide-react'
import { processAndUpload } from '@/lib/clientImageUpload'

const MAX_IMAGES = 3
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function ReviewForm({
  source,
  productId,
  orderId,
  defaultName = '',
  lockName = false,
  onDone,
  onCancel,
}: {
  source: 'Website Order' | 'Product Page' | 'Delivery Follow-up'
  productId?: string
  orderId?: string
  defaultName?: string
  lockName?: boolean
  onDone?: () => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const remaining = MAX_IMAGES - images.length
    const picked = Array.from(files).slice(0, remaining)
    setUploading(true)
    const next = [...images]
    for (const file of picked) {
      // HEIC from iPhones is allowed now — it's converted to JPEG in the browser.
      const heic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
      if (!heic && !ALLOWED.includes(file.type)) { setError('Use JPG, PNG or WEBP images'); continue }
      try {
        const url = await processAndUpload(file, { signEndpoint: '/api/reviews/upload-url', folder: 'reviews' })
        next.push(url)
      } catch (e) {
        setError((e as Error)?.message || 'Upload failed')
      }
    }
    setImages(next)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!rating) { setError('Please select a rating'); return }
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!text.trim()) { setError('Please write your review'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          rating,
          review_title: title.trim() || undefined,
          review_text: text.trim(),
          review_images: images,
          product_id: productId,
          order_id: orderId,
          source,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not submit your review'); setSubmitting(false); return }
      setDone(true)
      onDone?.()
    } catch {
      setError('Could not submit your review. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-semibold text-emerald-800">Thank you for sharing your experience!</p>
        <p className="mt-1 text-sm text-emerald-700">Your review will be published after approval.</p>
      </div>
    )
  }

  const input = 'w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'
  const label = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className={label}>Your rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="p-0.5"
            >
              <Star className={`h-7 w-7 transition-colors ${(hoverRating || rating) >= n ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className={label}>Your name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={lockName} maxLength={80} className={`${input} disabled:bg-gray-50 disabled:text-gray-500`} placeholder="e.g. Lakshmi Priya" />
      </div>

      {/* Title */}
      <div>
        <label className={label}>Review title <span className="text-gray-400 font-normal">(optional)</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={input} placeholder="e.g. Beautiful saree, rich colours" />
      </div>

      {/* Text */}
      <div>
        <label className={label}>Your review *</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] resize-y" placeholder="Tell us about the fabric, colours, fit and your experience…" />
      </div>

      {/* Images */}
      <div>
        <label className={label}>Photos <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span></label>
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#C2185B] hover:text-[#C2185B] transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">JPG, PNG or WEBP · max 5MB each</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 h-11 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting || uploading} className="flex-1 h-11 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}
