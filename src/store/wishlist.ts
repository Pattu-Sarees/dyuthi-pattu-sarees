import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  ids: string[]
  toggle: (id: string) => void
  add: (id: string) => void
  has: (id: string) => boolean
  count: () => number
  // Drop any stored keys whose product id isn't in `validProductIds`.
  // Used to reconcile the persisted wishlist after resolving products,
  // so the badge count never outnumbers the cards that actually render.
  pruneMissing: (validProductIds: string[]) => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      // Add-only (never removes) — used for bulk "move to wishlist" actions
      // where an item already wishlisted shouldn't get un-wishlisted.
      add: (id) =>
        set((s) => ({ ids: s.ids.includes(id) ? s.ids : [...s.ids, id] })),
      has: (id) => get().ids.includes(id),
      count: () => get().ids.length,
      pruneMissing: (validProductIds) =>
        set((s) => {
          const valid = new Set(validProductIds)
          // A key is `productId` or `productId::imageUrl` — keep it if its
          // product id resolved.
          const kept = s.ids.filter((k) => {
            const idx = k.indexOf('::')
            return valid.has(idx === -1 ? k : k.slice(0, idx))
          })
          return kept.length === s.ids.length ? s : { ids: kept }
        }),
    }),
    { name: 'saree-wishlist' }
  )
)
