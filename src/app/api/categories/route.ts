import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

// Public: the product form dropdown and the storefront mega menu read this.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createAnonClient()
    const { data, error } = await db
      .from('product_categories')
      .select('id, name, slug, description, menu_group')
      .order('name', { ascending: true })
    // Fall back to the built-in list if the table isn't there yet / read fails,
    // so the storefront never shows an empty menu.
    if (error || !data || data.length === 0) {
      return NextResponse.json({ categories: DEFAULT_CATEGORIES })
    }
    return NextResponse.json({ categories: data })
  } catch {
    return NextResponse.json({ categories: DEFAULT_CATEGORIES })
  }
}
