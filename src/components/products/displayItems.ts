import { Product } from '@/types'

// A single display item = one image (color variant) of a product.
export interface DisplayItem {
  key: string
  product: Product
  image: string
  imageIndex: number
  isNewArrival: boolean
  isBestSeller: boolean
}

// Flatten each product into one display item per image (color variant).
// Per-item merchandising flags come from color_variants (aligned with images);
// falls back to the product-level flag for legacy products without variant flags.
export function toDisplayItems(products: Product[]): DisplayItem[] {
  return products.flatMap((p) => {
    const variants = p.color_variants?.length ? p.color_variants : null
    const imgs = variants ? variants.map((v) => v.image) : (p.images?.length ? p.images : [''])
    return imgs.map((image, imageIndex) => {
      const v = variants?.[imageIndex]
      return {
        key: `${p.id}-${imageIndex}`,
        product: p,
        image,
        imageIndex,
        isNewArrival: v ? !!v.is_new_arrival : !!p.is_new_arrival,
        isBestSeller: v ? !!v.is_best_seller : !!p.is_best_seller,
      }
    })
  })
}
