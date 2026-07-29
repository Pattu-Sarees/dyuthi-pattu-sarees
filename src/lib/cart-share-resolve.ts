import type { Product } from '@/types'
import type { SharedCartItem } from '@/app/api/cart/share/route'

export interface SharedCartEntry {
  key: string
  product: Product
  image: string
  quantity: number
}

// Given the stored {product_id, image, quantity} rows and the products they
// reference, build one entry per row (order follows `items`). Rows whose
// product no longer exists are dropped.
export function buildSharedCartEntries(items: SharedCartItem[], products: Product[]): SharedCartEntry[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const entries: SharedCartEntry[] = []
  for (const item of items) {
    const product = byId.get(item.product_id)
    if (!product) continue
    const image = item.image || product.images?.[0] || ''
    entries.push({ key: `${item.product_id}::${image}`, product, image, quantity: item.quantity })
  }
  return entries
}
