'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, Share2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { useWishlistStore } from '@/store/wishlist'
import { buildWishlistEntries, parseWishKey } from '@/lib/wishlist-resolve'
import WishlistCard from '@/components/wishlist/WishlistCard'
import ShareWishlistModal from '@/components/wishlist/ShareWishlistModal'
import type { Product } from '@/types'

export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids)
  const toggle = useWishlistStore((s) => s.toggle)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [ownerName, setOwnerName] = useState('My')
  const [userId, setUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Unique product ids referenced by the wishlist keys.
  const productIds = useMemo(() => {
    const set = new Set(ids.map((k) => parseWishKey(k).id))
    return Array.from(set)
  }, [ids])

  // Fetch the referenced products (public columns only).
  useEffect(() => {
    if (!mounted) return
    if (productIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLUMNS)
      .in('id', productIds)
      .then(({ data }) => {
        if (cancelled) return
        setProducts((data as Product[]) || [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productIds, mounted])

  // Resolve the shopper's display name for the share template.
  useEffect(() => {
    if (!mounted) return
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
          const name = profile?.full_name?.trim() || data.user!.email?.split('@')[0] || 'My'
          setOwnerName(name)
        })
    })
  }, [mounted])

  const entries = useMemo(() => buildWishlistEntries(ids, products), [ids, products])

  const removeItem = (key: string) => {
    toggle(key)
    const { id } = parseWishKey(key)
    fetch(`/api/products/${id}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: -1 }),
    }).catch(() => {})
  }

  if (!mounted) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    )
  }

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#AD1457] fill-[#AD1457]" />
            <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]">My Wishlist</h1>
            {ids.length > 0 && <span className="text-sm text-gray-500">({ids.length})</span>}
          </div>
          {ids.length > 0 && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-4 py-2.5 rounded-md transition-colors"
            >
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Wishlist</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#4E1E24] mb-1">Your wishlist is empty</p>
            <p className="text-sm text-gray-500 mb-6">Tap the heart on any saree to save it here.</p>
            <Link
              href="/products"
              className="inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
            >
              Browse Sarees
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {entries.map((e) => (
              <WishlistCard key={e.key} product={e.product} image={e.image} onRemove={() => removeItem(e.key)} />
            ))}
          </div>
        )}
      </div>

      {shareOpen && <ShareWishlistModal items={ids} ownerName={ownerName} userId={userId} onClose={() => setShareOpen(false)} />}
    </div>
  )
}
