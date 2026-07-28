// Smart header search — matches ONLY four fields: product name, category,
// product code, and colour. Case-insensitive, whitespace-trimmed, and matched
// as the full phrase (so "pink peach" matches the colour "Pink Peach" but never
// unrelated colours like "Rust" or "Bottle Green").

// Trim, lower-case, and collapse internal whitespace to a single space.
export function normalizeSearch(search: string | null | undefined): string {
  return (search || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

// Escape LIKE metacharacters so a literal % or _ in the query isn't a wildcard.
function likeEscape(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`)
}

// Preferred filter: a single case-insensitive ilike of the whole query against
// the generated `search_text` column (name + code + category + colour, lower-
// cased). Returns the ilike pattern, or null when there's nothing to search.
// Requires the products-search-text.sql migration; callers fall back to
// buildFallbackSearchOr when the column is absent.
export function searchTextPattern(search: string | null | undefined): string | null {
  const n = normalizeSearch(search)
  return n ? `%${likeEscape(n)}%` : null
}

// Fallback for DBs where the search_text migration hasn't run yet. Matches the
// same four fields with the full phrase: name/code/category via ilike, and
// colour (a text[]) via array-contains on the whole title-cased element — so
// "pink peach" still finds the "Pink Peach" element. Partial colour fragments
// ("peach" alone) only work once the migration adds search_text.
export function buildFallbackSearchOr(search: string | null | undefined): string | null {
  const n = normalizeSearch(search)
  if (!n) return null
  // Strip characters that would break PostgREST or() syntax (commas, parens);
  // keep letters, numbers, spaces and hyphens (product codes use hyphens).
  const safe = n.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!safe) return null
  const titleCase = (s: string) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const parts = [
    `name.ilike.%${safe}%`,
    `code.ilike.%${safe}%`,
    `category.ilike.%${safe}%`,
    `color.cs.{${titleCase(safe)}}`, // whole colour element, e.g. {Pink Peach} or {Rust}
  ]
  return parts.join(',')
}
