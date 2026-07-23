import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import type { InventoryRow } from '@/types'
import { deriveVariants } from '@/lib/inventory'

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
    .select('id, name, images, category, status, stock_quantity, in_stock, sold_count, color_variants, fabric, description')
    .order('stock_quantity', { ascending: true })

  if (error) return NextResponse.json({ items: [] })

  const items: InventoryRow[] = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    image: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
    category: p.category,
    status: (p.status as 'active' | 'inactive') || 'active',
    stock_quantity: p.stock_quantity ?? 0,
    in_stock: !!p.in_stock,
    sold_count: p.sold_count ?? 0,
    variants: deriveVariants(p.color_variants, p.images, p.stock_quantity ?? 0),
    fabric: p.fabric || '',
    description: p.description || '',
  }))

  return NextResponse.json({ items })
}
