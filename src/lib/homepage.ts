import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { HOMEPAGE_SECTION_KEYS, type HomepageSection } from '@/types'

// Fetch all homepage sections in display order. Safe to call from the
// storefront — falls back to an empty list if the table doesn't exist yet.
// Wrapped in React.cache so the layout and the home page (which both need it
// in the same request) share a single DB round-trip instead of two.
export const getHomepageSections = cache(async function getHomepageSections(): Promise<HomepageSection[]> {
  const db = createAdminClient()
  const { data, error } = await db.from('homepage_sections').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return (data || []) as HomepageSection[]
})

// Convenience map keyed by section key, for storefront components. Also cached
// per-request so repeated callers reuse the same computed map.
export const getHomepageConfig = cache(async function getHomepageConfig(): Promise<Record<string, HomepageSection>> {
  const sections = await getHomepageSections()
  const map: Record<string, HomepageSection> = {}
  for (const s of sections) map[s.key] = s
  return map
})

export function isValidSectionKey(key: string): boolean {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(key)
}
