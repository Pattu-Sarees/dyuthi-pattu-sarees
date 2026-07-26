// Build a PostgREST `.or(...)` filter for a free-text product search.
// Splits the query into words and matches ANY word (partial/ilike) across the
// product's name, description, category and fabric — so "silk kanchi" matches
// "Soft Touch Kanchipattu" (silk) even though the exact phrase isn't in the name.
// Returns null when there's nothing searchable.
export function buildProductSearchOr(search: string | null | undefined): string | null {
  if (!search) return null
  // Keep letters/numbers/spaces only so commas/parens can't break the or() syntax.
  const cleaned = search.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
  const words = Array.from(new Set(cleaned.split(/\s+/).filter((w) => w.length >= 2))).slice(0, 6)
  if (words.length === 0) return null
  // Search across: name, slug (the closest thing to a product code), category,
  // fabric and description. (There is no dedicated product_code/SKU column.)
  const fields = ['name', 'slug', 'description', 'category', 'fabric']
  const parts: string[] = []
  for (const w of words) for (const f of fields) parts.push(`${f}.ilike.%${w}%`)
  return parts.join(',')
}
