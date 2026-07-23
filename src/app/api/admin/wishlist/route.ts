import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('id,name,images,category,wishlist_count,view_count')
    .order('wishlist_count', { ascending: false })

  if (error) return NextResponse.json({ totalAdds: 0, top: [], mostViewed: [] })

  const rows = (data || []) as Array<{ id: string; name: string; images: string[]; category: string; wishlist_count: number; view_count: number }>
  const totalAdds = rows.reduce((s, p) => s + (p.wishlist_count || 0), 0)
  const top = rows
    .filter((p) => (p.wishlist_count || 0) > 0)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, image: p.images?.[0] ?? null, category: p.category, count: p.wishlist_count || 0 }))
  const mostViewed = [...rows]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .filter((p) => (p.view_count || 0) > 0)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, image: p.images?.[0] ?? null, category: p.category, count: p.view_count || 0 }))

  return NextResponse.json({ totalAdds, top, mostViewed })
}
