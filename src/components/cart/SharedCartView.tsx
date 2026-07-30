'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check, Plus, Trash2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { fetchCollections, createCollection, addItemsToCollection, type Collection } from '@/lib/collections'
import { formatPrice, toTitleCase } from '@/lib/utils'
import type { SharedCartEntry } from '@/lib/cart-share-resolve'

// Lazy-loaded — each only loads when its dialog is actually opened.
const ShareCartModal = dynamic(() => import('@/components/cart/ShareCartModal'))
const SaveToCollectionSheet = dynamic(() => import('@/components/wishlist/SaveToCollectionSheet'))
const CreateCollectionModal = dynamic(() => import('@/components/wishlist/CreateCollectionModal'))

// Possessive form: "Sainath" -> "Sainath's", "My" -> "My"
function possessiveTitle(name: string) {
  if (!name || name.toLowerCase() === 'my') return 'My Cart-Share'
  return `${name}${name.endsWith('s') ? "'" : "'s"} Cart-Share`
}

export default function SharedCartView({
  entries: initialEntries,
  ownerName,
}: {
  entries: SharedCartEntry[]
  ownerName: string
}) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shareOpen, setShareOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const addItem = useCartStore((s) => s.addItem)

  // Resolve the viewer's identity — collections belong to the logged-in viewer,
  // not the original cart owner.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      fetchCollections().then(setCollections).catch(() => {})
    })
  }, [])

  const selectMode = selected.size > 0

  const toggleSelect = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const selectedEntries = entries.filter((e) => selected.has(e.key))
  const selectedKeys = () => Array.from(selected)

  // "+" opens the same "Save items to" collection picker used on the Wishlist
  // page — saves the selected shared items into one of the viewer's own
  // wishlist collections (or a brand-new one).
  const openSaveToCollection = () => {
    if (!userId) {
      toast.info('Please sign in to save items to a collection')
      router.push(`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`)
      return
    }
    setSheetOpen(true)
  }

  const saveToExisting = async (c: Collection) => {
    try {
      await addItemsToCollection(c, selectedKeys())
      toast.success(`Saved to ${c.name}`)
      setSheetOpen(false)
      setSelected(new Set())
      fetchCollections().then(setCollections).catch(() => {})
    } catch {
      toast.error('Could not save to collection')
    }
  }

  const doCreateCollection = async (name: string) => {
    if (!userId) return
    try {
      const cover = selectedEntries[0]?.image || null
      await createCollection(userId, name, selectedKeys(), cover)
      toast.success(`Collection "${name}" created`)
      setCreateOpen(false)
      setSelected(new Set())
      fetchCollections().then(setCollections).catch(() => {})
    } catch {
      toast.error('Could not create collection')
    }
  }

  // Removes items from THIS shared view only (client-side) — never touches
  // the original owner's cart or the shared_carts row.
  const removeSelectedFromView = () => {
    const n = selectedEntries.length
    setEntries((prev) => prev.filter((e) => !selected.has(e.key)))
    setSelected(new Set())
    toast.success(`Removed ${n} item${n === 1 ? '' : 's'} from this view`)
  }

  const title = possessiveTitle(ownerName)

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-14 w-14 text-gray-200 mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4E1E24] mb-1">Nothing to show</p>
        <p className="text-sm text-gray-500 mb-6">These items are no longer available.</p>
        <Link href="/products" className="inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
          Browse Sarees
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]">{selectMode ? 'Items Selected' : title}</h1>
          <span className="text-sm text-gray-500">({selectMode ? selected.size : entries.length})</span>
        </div>

        {selectMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={openSaveToCollection}
              aria-label="Save selected items to a collection"
              title="Save to collection"
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={removeSelectedFromView}
              aria-label="Remove selected items from this view"
              title="Remove from view"
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-red-600 hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShareOpen(true)}
              aria-label="Share selected items"
              title="Share"
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6 md:mb-8">Shared from Dyuthi Pattu Sarees</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {entries.map((e) => {
          const checked = selected.has(e.key)
          return (
            <div
              key={e.key}
              className={`group relative bg-white rounded-lg border transition-all duration-300 flex flex-col ${
                checked ? 'border-[#AD1457] ring-2 ring-[#AD1457]' : 'border-gray-100 hover:shadow-md'
              }`}
            >
              <button type="button" onClick={() => toggleSelect(e.key)} className="relative aspect-[9/10] bg-gray-100 block w-full text-left">
                <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                  {e.image ? (
                    <Image src={e.image} alt={e.product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-rose-50 to-amber-50">🥻</div>
                  )}
                </div>
                {e.quantity > 1 && (
                  <span className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Qty {e.quantity}
                  </span>
                )}
              </button>

              <button
                onClick={() => toggleSelect(e.key)}
                aria-label={checked ? 'Deselect item' : 'Select item'}
                className={`absolute top-2.5 right-2.5 z-10 h-7 w-7 flex items-center justify-center rounded-full border-2 transition-colors ${
                  checked ? 'bg-[#AD1457] border-[#AD1457] text-white' : 'bg-white/90 border-gray-300 text-transparent'
                }`}
              >
                <Check className="h-4 w-4" />
              </button>

              <div className="p-3 flex flex-col flex-1">
                <Link href={`/products/${e.product.id}`}>
                  <h3 className="text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem] hover:text-[#C2185B]">
                    {toTitleCase(e.product.name)}
                  </h3>
                </Link>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-base font-bold text-[#C2185B]">{formatPrice(e.product.price)}</span>
                </div>
                <button
                  onClick={() => {
                    addItem(e.product, e.quantity, e.image)
                    toast.success('Added to bag', { description: e.product.name })
                  }}
                  className="mt-auto w-full flex items-center justify-center gap-2 border border-[#AD1457] text-[#AD1457] hover:bg-[#AD1457] hover:text-white font-semibold text-sm py-2.5 rounded-md transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to Bag
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {shareOpen && (
        <ShareCartModal
          items={selectedEntries.map((e) => ({ product_id: e.product.id, image: e.image, quantity: e.quantity }))}
          ownerName={ownerName}
          userId={null}
          onClose={() => setShareOpen(false)}
        />
      )}

      {sheetOpen && (
        <SaveToCollectionSheet
          collections={collections}
          onCreateNew={() => {
            setSheetOpen(false)
            setCreateOpen(true)
          }}
          onSelect={saveToExisting}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {createOpen && (
        <CreateCollectionModal
          previewImages={selectedEntries.map((e) => e.image)}
          onCreate={doCreateCollection}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  )
}
