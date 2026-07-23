import type { Product } from '@/types'

// A wishlist entry is stored as either `productId` or `productId::imageUrl`.
export function parseWishKey(key: string): { id: string; image?: string } {
  const idx = key.indexOf('::')
  if (idx === -1) return { id: key }
  return { id: key.slice(0, idx), image: key.slice(idx + 2) }
}

export interface WishlistEntry {
  key: string
  product: Product
  image: string
}

// Given wishlist keys and the products they reference, build one entry per key
// (a product wishlisted in two colours yields two cards). Order follows `keys`.
export function buildWishlistEntries(keys: string[], products: Product[]): WishlistEntry[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const entries: WishlistEntry[] = []
  for (const key of keys) {
    const { id, image } = parseWishKey(key)
    const product = byId.get(id)
    if (!product) continue
    entries.push({ key, product, image: image || product.images?.[0] || '' })
  }
  return entries
}
