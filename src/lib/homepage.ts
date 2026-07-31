import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { HOMEPAGE_SECTION_KEYS, type HomepageSection } from '@/types'

// Cross-request cache (60s) of the homepage sections. This removes the DB
// round-trip on EVERY navigation to Home (the "any page → home" delay). Admin
// edits appear within 60s (or instantly if you call revalidateTag('homepage')).
const getSectionsCached = unstable_cache(
  async (): Promise<HomepageSection[]> => {
    const db = createAdminClient()
    const { data, error } = await db.from('homepage_sections').select('*').order('sort_order', { ascending: true })
    if (error) return []
    return (data || []) as HomepageSection[]
  },
  ['homepage-sections'],
  { revalidate: 60, tags: ['homepage'] }
)

// React.cache still dedups within a single request (layout + page share it).
export const getHomepageSections = cache(getSectionsCached)

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
