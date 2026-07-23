import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export interface SearchHit { id: string; label: string; sub?: string; image?: string | null; link: string }

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Strip characters that break PostgREST or() filters.
  const q = (req.nextUrl.searchParams.get('q') || '').replace(/[,()%]/g, '').trim()
  if (q.length < 1) return NextResponse.json({ results: {} })

  const db = createAdminClient()
  const like = `%${q}%`
  const L = 5

  const [prod, ord, cust, lead, coup] = await Promise.all([
    db.from('products').select('id,name,images,category').or(`name.ilike.${like},category.ilike.${like},fabric.ilike.${like}`).limit(L),
    db.from('orders').select('id,order_number,customer_name,customer_phone,total_amount').or(`order_number.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`).order('created_at', { ascending: false }).limit(L),
    db.from('orders').select('customer_name,customer_phone').or(`customer_name.ilike.${like},customer_phone.ilike.${like}`).not('customer_phone', 'is', null).limit(20),
    db.from('leads').select('id,name,email,phone').or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(L),
    db.from('coupons').select('id,code').ilike('code', like).limit(L),
  ])

  const products: SearchHit[] = (prod.data || []).map((p) => ({ id: p.id, label: p.name, sub: p.category, image: p.images?.[0] ?? null, link: `/admin/products?highlight=${p.id}` }))
  const inventory: SearchHit[] = (prod.data || []).map((p) => ({ id: p.id, label: p.name, sub: p.category, image: p.images?.[0] ?? null, link: `/admin/inventory?highlight=${p.id}` }))
  const orders: SearchHit[] = (ord.data || []).map((o) => ({ id: o.id, label: o.order_number || o.id.slice(0, 8), sub: o.customer_name || 'Guest', link: `/admin/orders?highlight=${o.id}` }))
  const leads: SearchHit[] = (lead.data || []).map((l) => ({ id: l.id, label: l.name, sub: l.email || l.phone || undefined, link: `/admin/leads?highlight=${l.id}` }))
  const coupons: SearchHit[] = (coup.data || []).map((c) => ({ id: c.id, label: c.code, link: `/admin/coupons?highlight=${c.id}` }))

  // Customers are derived from orders — dedupe by phone.
  const seen = new Set<string>()
  const customers: SearchHit[] = []
  for (const c of (cust.data || []) as Array<{ customer_name: string | null; customer_phone: string | null }>) {
    const phone = (c.customer_phone || '').trim()
    if (!phone || seen.has(phone)) continue
    seen.add(phone)
    customers.push({ id: phone, label: c.customer_name || 'Guest', sub: phone, link: `/admin/customers?highlight=${encodeURIComponent(phone)}` })
    if (customers.length >= L) break
  }

  return NextResponse.json({ results: { products, inventory, orders, customers, leads, coupons } })
}
