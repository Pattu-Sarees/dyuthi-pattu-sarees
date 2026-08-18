// Category metadata shared across the storefront + admin.
//
// Categories are now admin-managed (stored in the `product_categories` table).
// The constants below are the FALLBACK used only when the DB is unreachable or
// hasn't been seeded yet — so the form dropdown and mega menu never go empty.

// The mega-menu columns, in display order.
export const MENU_GROUPS = ['Sarees', 'Other Sarees', 'Lehengas', 'Dress Materials'] as const
export type MenuGroup = (typeof MENU_GROUPS)[number]

export interface ProductCategory {
  id?: string
  name: string
  slug: string
  description?: string | null
  menu_group: string
}

// Legacy static slug list — kept for fallback + backwards-compatible imports.
export const PRODUCT_CATEGORIES = [
  'mangalgiri',
  'kuppadam',
  'mangalgiri kuppadam',
  'gadwal pattu',
  'gadwal cotton',
  'kota',
  'kanchipattu',
  'soft silks',
  'jamdhani',
  'butter silk',
  'green mango',
  'lehengas',
  'dress materials',
] as const

// Fallback category rows (mirror the seed in supabase/product-categories.sql).
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { name: 'Mangalgiri', slug: 'mangalgiri', menu_group: 'Sarees' },
  { name: 'Kuppadam', slug: 'kuppadam', menu_group: 'Sarees' },
  { name: 'Mangalgiri Kuppadam', slug: 'mangalgiri kuppadam', menu_group: 'Sarees' },
  { name: 'Gadwal Pattu', slug: 'gadwal pattu', menu_group: 'Sarees' },
  { name: 'Gadwal Cotton', slug: 'gadwal cotton', menu_group: 'Sarees' },
  { name: 'Kota', slug: 'kota', menu_group: 'Sarees' },
  { name: 'Pure Kanchipattu', slug: 'kanchipattu', menu_group: 'Sarees' },
  { name: 'Soft Silks', slug: 'soft silks', menu_group: 'Sarees' },
  { name: 'Jamdhani', slug: 'jamdhani', menu_group: 'Other Sarees' },
  { name: 'Butter Silk', slug: 'butter silk', menu_group: 'Other Sarees' },
  { name: 'Green Mango', slug: 'green mango', menu_group: 'Other Sarees' },
  { name: 'Lehengas', slug: 'lehengas', menu_group: 'Lehengas' },
  { name: 'Dress Materials', slug: 'dress materials', menu_group: 'Dress Materials' },
]

// A category's slug is its lower-cased, single-spaced name. Spaces are kept
// (not hyphenated) to match the existing slugs already stored on products.
export function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Group + alphabetically sort categories for the mega menu.
export function groupCategories(cats: ProductCategory[]): { title: string; items: ProductCategory[] }[] {
  return MENU_GROUPS.map((group) => ({
    title: group,
    items: cats
      .filter((c) => c.menu_group === group)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))
}
