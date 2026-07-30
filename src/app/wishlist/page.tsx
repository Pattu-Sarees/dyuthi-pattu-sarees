'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, Share2, Loader2, Layers, PackageX, ChevronLeft, Plus, Trash2, FolderPlus, MoreVertical, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { useWishlistStore } from '@/store/wishlist'
import { buildWishlistEntries, parseWishKey, type WishlistEntry } from '@/lib/wishlist-resolve'
import { fetchCollections, createCollection, addItemsToCollection, renameCollection, deleteCollection, type Collection } from '@/lib/collections'
import dynamic from 'next/dynamic'
import WishlistCard from '@/components/wishlist/WishlistCard'

// Lazy-loaded — each dialog only loads when the user opens it, trimming the
// wishlist page's initial JS.
const ShareWishlistModal = dynamic(() => import('@/components/wishlist/ShareWishlistModal'))
const SaveToCollectionSheet = dynamic(() => import('@/components/wishlist/SaveToCollectionSheet'))
const CreateCollectionModal = dynamic(() => import('@/components/wishlist/CreateCollectionModal'))
const RenameCollectionModal = dynamic(() => import('@/components/wishlist/RenameCollectionModal'))
import type { Product } from '@/types'
import { toast } from 'sonner'

type Tab = 'wishlist' | 'collections' | 'outofstock'

export default function WishlistPage() {
  const router = useRouter()
  const ids = useWishlistStore((s) => s.ids)
  const toggle = useWishlistStore((s) => s.toggle)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [ownerName, setOwnerName] = useState('My')
  const [userId, setUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [tab, setTab] = useState<Tab>('wishlist')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [renameTarget, setRenameTarget] = useState<Collection | null>(null)
  const [shareItemsOverride, setShareItemsOverride] = useState<string[] | null>(null)

  useEffect(() => setMounted(true), [])

  const productIds = useMemo(() => Array.from(new Set(ids.map((k) => parseWishKey(k).id))), [ids])

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
    createClient()
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

  const loadCollections = useCallback(() => {
    fetchCollections().then(setCollections).catch(() => {})
  }, [])

  // Resolve the shopper's identity (for the share template + collections owner).
  useEffect(() => {
    if (!mounted) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      loadCollections()
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          setOwnerName(profile?.full_name?.trim() || data.user!.email?.split('@')[0] || 'My')
        })
    })
  }, [mounted, loadCollections])

  const entries = useMemo(() => buildWishlistEntries(ids, products), [ids, products])
  // Availability is per wishlisted design/colour: use the matching variant's
  // pieces, falling back to the product's total stock when there are no variants.
  const variantQty = (e: WishlistEntry) => {
    const v = e.product.color_variants?.find((cv) => cv.image === e.image)
    return v ? (Number(v.quantity) || 0) : (e.product.stock_quantity ?? 0)
  }
  const inStock = useMemo(() => entries.filter((e) => variantQty(e) > 0), [entries])
  const outOfStock = useMemo(() => entries.filter((e) => variantQty(e) <= 0), [entries])

  const removeItem = useCallback(
    (key: string) => {
      toggle(key)
      const { id } = parseWishKey(key)
      fetch(`/api/products/${id}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1 }),
      }).catch(() => {})
    },
    [toggle]
  )

  // ---- Selection / collections flow ----
  const startNewCollection = () => {
    if (!userId) {
      toast.info('Please sign in to create collections')
      router.push('/login?redirect=/wishlist')
      return
    }
    setTab('wishlist')
    setSelected(new Set())
    setSelectMode(true)
  }

  const cancelSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const toggleSelect = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const selectedEntries = useMemo(() => entries.filter((e) => selected.has(e.key)), [entries, selected])

  const deleteSelected = () => {
    if (selected.size === 0) return
    selected.forEach((key) => removeItem(key))
    toast.success(`Removed ${selected.size} item${selected.size === 1 ? '' : 's'}`)
    cancelSelect()
  }

  const saveToExisting = async (c: Collection) => {
    try {
      await addItemsToCollection(c, Array.from(selected))
      toast.success(`Saved to ${c.name}`)
      setSheetOpen(false)
      cancelSelect()
      loadCollections()
    } catch {
      toast.error('Could not save to collection')
    }
  }

  const doCreateCollection = async (name: string) => {
    if (!userId) return
    try {
      const cover = selectedEntries[0]?.image || null
      await createCollection(userId, name, Array.from(selected), cover)
      toast.success(`Collection "${name}" created`)
      setCreateOpen(false)
      cancelSelect()
      loadCollections()
      setTab('collections')
    } catch {
      toast.error('Could not create collection')
    }
  }

  // ---- Collection card actions (edit / delete / share) ----
  const shareCollection = (c: Collection) => {
    setShareItemsOverride(c.items)
    setShareOpen(true)
  }
  const doRenameCollection = async (name: string) => {
    if (!renameTarget) return
    try {
      await renameCollection(renameTarget.id, name)
      toast.success('Collection renamed')
      setRenameTarget(null)
      loadCollections()
    } catch {
      toast.error('Could not rename collection')
    }
  }
  const removeCollection = async (c: Collection) => {
    try {
      await deleteCollection(c.id)
      toast.success(`Deleted "${c.name}"`)
      loadCollections()
    } catch {
      toast.error('Could not delete collection')
    }
  }

  // ---- Out of stock cleanup ----
  const removeAllOutOfStock = () => {
    if (outOfStock.length === 0) return
    const n = outOfStock.length
    outOfStock.forEach((e) => removeItem(e.key))
    toast.success(`Removed ${n} out-of-stock item${n === 1 ? '' : 's'}`)
    setTab('wishlist')
  }

  if (!mounted) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    )
  }

  const gridCls = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5'

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-baseline gap-2">
            {tab !== 'wishlist' && (
              <button onClick={() => setTab('wishlist')} aria-label="Back" className="self-center p-1 -ml-1 rounded hover:bg-black/5 text-[#4E1E24]">
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]">
              {tab === 'collections' ? 'Collections' : tab === 'outofstock' ? 'Out of Stock' : 'My Wishlist'}
            </h1>
            {tab === 'wishlist' && <span className="text-sm md:text-base text-gray-500 font-medium">{ids.length} items</span>}
          </div>

          {/* Right side: share (normal) or selection status */}
          {tab === 'wishlist' && !selectMode && ids.length > 0 && (
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-4 py-2.5 rounded-md transition-colors"
            >
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share Wishlist</span>
            </button>
          )}
          {selectMode && (
            <button onClick={cancelSelect} className="text-sm font-semibold text-[#AD1457] hover:text-[#880E4F]">
              Cancel
            </button>
          )}
        </div>

        {/* ===== Collections / Out of Stock option buttons + selection actions ===== */}
        {tab === 'wishlist' && ids.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            {!selectMode ? (
              <>
                <button
                  onClick={() => setTab('collections')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
                >
                  <Layers className="h-4 w-4" /> Collections
                </button>
                <button
                  onClick={() => setTab('outofstock')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
                >
                  <PackageX className="h-4 w-4" /> Out of Stock
                  {outOfStock.length > 0 && <span className="ml-1 text-xs text-gray-500">({outOfStock.length})</span>}
                </button>
              </>
            ) : (
              // Selection mode: disabled options + active action icons (before share)
              <>
                <span className="flex-1 text-sm font-semibold text-[#4E1E24]">{selected.size} selected</span>
                <button
                  onClick={() => selected.size > 0 && setSheetOpen(true)}
                  disabled={selected.size === 0}
                  aria-label="Add to collection"
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-[#4E1E24] disabled:opacity-40 enabled:hover:border-[#AD1457] enabled:hover:text-[#AD1457] transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={selected.size === 0}
                  aria-label="Delete selected"
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-red-600 disabled:opacity-40 enabled:hover:border-red-500 enabled:hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShareOpen(true)}
                  aria-label="Share"
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* ===== Body ===== */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        ) : tab === 'collections' ? (
          <CollectionsView
            collections={collections}
            onNew={startNewCollection}
            onEdit={setRenameTarget}
            onDelete={removeCollection}
            onShare={shareCollection}
          />
        ) : tab === 'outofstock' ? (
          <OutOfStockView entries={outOfStock} onRemoveAll={removeAllOutOfStock} onRemove={removeItem} gridCls={gridCls} />
        ) : entries.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className={gridCls}>
            {(selectMode ? entries : inStock.concat(outOfStock)).map((e) => (
              <WishlistCard
                key={e.key}
                product={e.product}
                image={e.image}
                onRemove={() => removeItem(e.key)}
                selectMode={selectMode}
                selected={selected.has(e.key)}
                onToggleSelect={() => toggleSelect(e.key)}
              />
            ))}
          </div>
        )}
      </div>

      {shareOpen && (
        <ShareWishlistModal
          items={shareItemsOverride ?? (selectMode && selected.size > 0 ? Array.from(selected) : ids)}
          ownerName={ownerName}
          userId={shareItemsOverride ? null : userId}
          onClose={() => {
            setShareOpen(false)
            setShareItemsOverride(null)
          }}
        />
      )}
      {renameTarget && (
        <RenameCollectionModal
          initialName={renameTarget.name}
          onSave={doRenameCollection}
          onClose={() => setRenameTarget(null)}
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
    </div>
  )
}

function EmptyWishlist() {
  return (
    <div className="text-center py-20">
      <Heart className="h-14 w-14 text-gray-200 mx-auto mb-4" />
      <p className="text-lg font-semibold text-[#4E1E24] mb-1">Your wishlist is empty</p>
      <p className="text-sm text-gray-500 mb-6">Tap the heart on any saree to save it here.</p>
      <Link href="/products" className="inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
        Browse Sarees
      </Link>
    </div>
  )
}

function CollectionsView({
  collections,
  onNew,
  onEdit,
  onDelete,
  onShare,
}: {
  collections: Collection[]
  onNew: () => void
  onEdit: (c: Collection) => void
  onDelete: (c: Collection) => void
  onShare: (c: Collection) => void
}) {
  const [menuId, setMenuId] = useState<string | null>(null)

  // Close the open menu on any outside click.
  useEffect(() => {
    if (!menuId) return
    const close = () => setMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuId])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
      {/* New Collection card */}
      <button
        onClick={onNew}
        className="aspect-[9/10] flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-[#4E1E24] hover:border-[#AD1457] hover:text-[#AD1457] transition-colors"
      >
        <FolderPlus className="h-8 w-8" />
        <span className="text-sm font-semibold">New Collection</span>
      </button>

      {collections.map((c) => (
        <div key={c.id} className="group relative rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all">
          <Link href={`/wishlist/collection/${c.id}`} className="block">
            <div className="relative aspect-[9/10] bg-gray-100">
              {c.cover ? (
                <Image src={c.cover} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-rose-50 to-amber-50">🥻</div>
              )}
            </div>
            <div className="p-3 pr-9">
              <p className="font-semibold text-[#4E1E24] truncate">{c.name}</p>
              <p className="text-xs text-gray-500">{c.items.length} Item{c.items.length === 1 ? '' : 's'}</p>
            </div>
          </Link>

          {/* 3-dots menu — bottom-right */}
          <div className="absolute bottom-2 right-1.5">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuId(menuId === c.id ? null : c.id)
              }}
              aria-label="Collection options"
              className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-black/5 hover:text-[#4E1E24] transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {menuId === c.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-9 right-0 z-20 w-40 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
              >
                <button onClick={() => { setMenuId(null); onEdit(c) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4E1E24] hover:bg-gray-50">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => { setMenuId(null); onDelete(c) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <button onClick={() => { setMenuId(null); onShare(c) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#4E1E24] hover:bg-gray-50">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OutOfStockView({
  entries,
  onRemoveAll,
  onRemove,
  gridCls,
}: {
  entries: WishlistEntry[]
  onRemoveAll: () => void
  onRemove: (key: string) => void
  gridCls: string
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <PackageX className="h-14 w-14 text-gray-200 mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4E1E24] mb-1">No out-of-stock items</p>
        <p className="text-sm text-gray-500">Everything in your wishlist is available. 🎉</p>
      </div>
    )
  }
  return (
    <>
      <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 mb-5">
        <span className="text-sm font-medium text-[#4E1E24]">Clean up out of stock items!</span>
        <button
          onClick={onRemoveAll}
          className="inline-flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Remove ({entries.length})
        </button>
      </div>
      <div className={gridCls}>
        {entries.map((e) => (
          <WishlistCard key={e.key} product={e.product} image={e.image} onRemove={() => onRemove(e.key)} />
        ))}
      </div>
    </>
  )
}
