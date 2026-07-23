'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, Trash2, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { buildWishlistEntries, parseWishKey } from '@/lib/wishlist-resolve'
import { deleteCollection, type Collection } from '@/lib/collections'
import WishlistCard from '@/components/wishlist/WishlistCard'
import type { Product } from '@/types'
import { toast } from 'sonner'

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [collection, setCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('wishlist_collections')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (cancelled) return
        if (!data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const col = data as Collection
        setCollection(col)
        const ids = Array.from(new Set((col.items || []).map((k) => parseWishKey(k).id)))
        if (ids.length > 0) {
          const { data: prods } = await supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS).in('id', ids)
          if (!cancelled) setProducts((prods as Product[]) || [])
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const entries = useMemo(() => (collection ? buildWishlistEntries(collection.items || [], products) : []), [collection, products])

  const removeFromCollection = async (key: string) => {
    if (!collection) return
    const items = collection.items.filter((k) => k !== key)
    setCollection({ ...collection, items })
    const { error } = await createClient().from('wishlist_collections').update({ items }).eq('id', collection.id)
    if (error) toast.error('Could not update collection')
  }

  const removeCollection = async () => {
    if (!collection) return
    try {
      await deleteCollection(collection.id)
      toast.success('Collection deleted')
      router.push('/wishlist')
    } catch {
      toast.error('Could not delete collection')
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    )
  }

  if (notFound || !collection) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <Layers className="h-14 w-14 text-gray-200 mb-4" />
        <p className="text-lg font-semibold text-[#4E1E24] mb-1">Collection not found</p>
        <Link href="/wishlist" className="mt-4 inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
          Back to Wishlist
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-baseline gap-2">
            <Link href="/wishlist" aria-label="Back" className="self-center p-1 -ml-1 rounded hover:bg-black/5 text-[#4E1E24]">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]">{collection.name}</h1>
            <span className="text-sm text-gray-500 font-medium">{collection.items.length} items</span>
          </div>
          <button
            onClick={removeCollection}
            className="inline-flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-gray-500 py-16 text-center">This collection is empty.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {entries.map((e) => (
              <WishlistCard key={e.key} product={e.product} image={e.image} onRemove={() => removeFromCollection(e.key)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
