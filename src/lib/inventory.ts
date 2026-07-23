import type { InventoryItem } from '@/types'

// Normalise stored color_variants into a clean { image, quantity }[] list,
// handling both the current { image, quantity } shape and the older
// { images: [...], quantity } shape.
export function normaliseVariants(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((v) => {
    if (!v || typeof v !== 'object') return []
    const o = v as { image?: string; images?: string[]; quantity?: number; is_new_arrival?: boolean; is_best_seller?: boolean; additional_images?: string[] }
    const flags = {
      is_new_arrival: !!o.is_new_arrival,
      is_best_seller: !!o.is_best_seller,
      additional_images: Array.isArray(o.additional_images) ? o.additional_images.filter((i) => typeof i === 'string') : [],
    }
    if (typeof o.image === 'string') return [{ image: o.image, quantity: Number(o.quantity) || 0, ...flags }]
    if (Array.isArray(o.images)) return o.images.filter((i) => typeof i === 'string').map((img) => ({ image: img, quantity: Number(o.quantity) || 0, ...flags }))
    return []
  })
}

// Derive a per-colour breakdown for a product. If it already has variants, use
// them. Otherwise fall back to the product's images, putting the whole current
// stock on the first image (a starting point the admin can redistribute). This
// lets older products with no color_variants still be managed per item.
export function deriveVariants(
  rawVariants: unknown,
  images: string[] | null | undefined,
  stockQuantity: number,
): InventoryItem[] {
  const existing = normaliseVariants(rawVariants)
  if (existing.length > 0) return existing

  const imgs = (Array.isArray(images) ? images : []).filter((i) => typeof i === 'string')
  if (imgs.length === 0) return []
  return imgs.map((image, i) => ({ image, quantity: i === 0 ? Math.max(0, stockQuantity || 0) : 0 }))
}
