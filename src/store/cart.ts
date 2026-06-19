import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, image?: string) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
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
        set({ items: get().items.filter((i) => i.key !== key) })
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

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'saree-cart' }
  )
)
