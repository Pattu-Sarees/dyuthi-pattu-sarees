import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  // Keys of items the user has UN-checked. Kept as an "opt-out" list (rather
  // than an opt-in "selected" list) so items are selected by default — both
  // for new items and for carts persisted before this field existed.
  deselected: string[]
  addItem: (product: Product, quantity?: number, image?: string) => void
  removeItem: (key: string) => void
  removeItems: (keys: string[]) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  toggleSelected: (key: string) => void
  selectAll: () => void
  isSelected: (key: string) => boolean
  selectedItems: () => CartItem[]
  totalItems: () => number
  totalPrice: () => number
}

// Max pieces available for a specific image (falls back to total stock)
function maxForImage(product: Product, image: string): number {
  const variant = product.color_variants?.find((v) => v.image === image)
  if (variant) return Number(variant.quantity) || 0
  return Number(product.stock_quantity) || 0
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deselected: [],

      addItem: (product, quantity = 1, image) => {
        const img = image || product.images?.[0] || ''
        const max = maxForImage(product, img)
        if (max <= 0) return // sold out — cannot add
        const key = `${product.id}::${img}`
        const items = get().items
        const existing = items.find((i) => i.key === key)
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, max)
          set({ items: items.map((i) => (i.key === key ? { ...i, quantity: newQty, maxQty: max } : i)) })
        } else {
          set({
            items: [
              ...items,
              { key, product_id: product.id, image: img, quantity: Math.min(quantity, max), maxQty: max, product },
            ],
          })
        }
      },

      removeItem: (key) => {
        set({
          items: get().items.filter((i) => i.key !== key),
          deselected: get().deselected.filter((k) => k !== key),
        })
      },

      removeItems: (keys) => {
        const remove = new Set(keys)
        set({
          items: get().items.filter((i) => !remove.has(i.key)),
          deselected: get().deselected.filter((k) => !remove.has(k)),
        })
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key)
          return
        }
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(quantity, i.maxQty) } : i
          ),
        })
      },

      clearCart: () => set({ items: [], deselected: [] }),

      toggleSelected: (key) => {
        const d = get().deselected
        set({ deselected: d.includes(key) ? d.filter((k) => k !== key) : [...d, key] })
      },

      selectAll: () => set({ deselected: [] }),

      isSelected: (key) => !get().deselected.includes(key),

      selectedItems: () => {
        const d = get().deselected
        return get().items.filter((i) => !d.includes(i.key))
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'saree-cart' }
  )
)
