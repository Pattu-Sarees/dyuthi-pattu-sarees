import { createAdminClient } from '@/lib/supabase/admin'
import { HOMEPAGE_SECTION_KEYS, type HomepageSection } from '@/types'

// Fetch all homepage sections in display order. Safe to call from the
// storefront — falls back to an empty list if the table doesn't exist yet.
export async function getHomepageSections(): Promise<HomepageSection[]> {
  const db = createAdminClient()
  const { data, error } = await db.from('homepage_sections').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return (data || []) as HomepageSection[]
}

// Convenience map keyed by section key, for storefront components.
export async function getHomepageConfig(): Promise<Record<string, HomepageSection>> {
  const sections = await getHomepageSections()
  const map: Record<string, HomepageSection> = {}
  for (const s of sections) map[s.key] = s
  return map
}

export function isValidSectionKey(key: string): boolean {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(key)
}
