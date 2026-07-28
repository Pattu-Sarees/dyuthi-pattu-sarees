import { Product } from '@/types'
import { normalizeSearch } from '@/lib/product-search'

// A single display item = one image (color variant) of a product.
export interface DisplayItem {
  key: string
  product: Product
  image: string
  imageIndex: number
  isNewArrival: boolean
  isBestSeller: boolean
  // Colour/shade name of this specific variant (used to filter colour searches).
  color?: string
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
        color: v?.color,
      }
    })
  })
}

// Colour-aware search filter for the flattened cards. A product's search_text
// match pulls in ALL its colour-variant cards; when the query matches a colour,
// narrow to just the variant(s) whose own colour matches — so searching
// "pink peach" shows only the Pink Peach card, not every shade of that product.
// Products matched by name/code/category (no colour hit) keep all their cards.
export function filterItemsForColorSearch(items: DisplayItem[], search: string | null | undefined): DisplayItem[] {
  const n = normalizeSearch(search)
  if (!n) return items

  const byProduct = new Map<string, DisplayItem[]>()
  for (const it of items) {
    const arr = byProduct.get(it.product.id)
    if (arr) arr.push(it)
    else byProduct.set(it.product.id, [it])
  }

  const out: DisplayItem[] = []
  for (const group of byProduct.values()) {
    const colorHits = group.filter((it) => it.color && it.color.toLowerCase().includes(n))
    out.push(...(colorHits.length ? colorHits : group))
  }
  return out
}
