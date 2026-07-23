import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  count: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      count: () => get().ids.length,
    }),
    { name: 'saree-wishlist' }
  )
)
