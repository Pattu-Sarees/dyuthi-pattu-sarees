import { createAdminClient } from '@/lib/supabase/admin'
import { getLowStockThreshold } from '@/lib/settings'

export interface SalesPoint { date: string; revenue: number }
export interface TopCategory { category: string; qty: number; pct: number }
export interface LowStockItem { id: string; name: string; stock: number; image: string | null }
export interface ProductHighlight { id: string; name: string; image: string | null; value: number }

export interface DashboardMetrics {
  totalProducts: number
  totalCategories: number
  totalInventory: number
  todaysOrders: number
  monthlyRevenue: number
  prevMonthRevenue: number
  revenueGrowth: number
  salesTrend: SalesPoint[]
  topCategories: TopCategory[]
  lowStock: LowStockItem[]
  newLeads: number
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  wishlistAdds: number
  bestSelling: ProductHighlight | null
  mostViewed: ProductHighlight | null
}

const REVENUE_STATUSES = ['delivered']

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

export interface DateRange { from: string; to: string } // ISO, [from, to)

export async function getDashboardMetrics(range?: DateRange): Promise<DashboardMetrics> {
  const db = createAdminClient()
  const lowThreshold = await getLowStockThreshold()
  const now = new Date()

  // Default to the current month if no range is supplied.
  const from = range?.from ? new Date(range.from) : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = range?.to ? new Date(range.to) : now
  const duration = Math.max(1, to.getTime() - from.getTime())
  const prevTo = from
  const prevFrom = new Date(from.getTime() - duration)

  const fromISO = from.toISOString()
  const toISO = to.toISOString()
  const prevFromISO = prevFrom.toISOString()
  const prevToISO = prevTo.toISOString()

  const [products, rangeOrders, prevOrders, leads, deliveredItems] = await Promise.all([
    db.from('products').select('id,name,category,stock_quantity,images,review_count,rating,status,sold_count,view_count,wishlist_count'),
    db.from('orders').select('id,total_amount,created_at,status').gte('created_at', fromISO).lt('created_at', toISO),
    db.from('orders').select('total_amount,status').gte('created_at', prevFromISO).lt('created_at', prevToISO),
    db.from('leads').select('id,status,created_at').gte('created_at', fromISO).lt('created_at', toISO),
    db.from('order_items').select('product_id,product_name,product_image,quantity,orders!inner(status,created_at)').eq('orders.status', 'delivered').gte('orders.created_at', fromISO).lt('orders.created_at', toISO),
  ])

  const productRows = (products.data || []) as Array<{ id: string; name: string; category: string; stock_quantity: number; images: string[]; review_count: number; rating: number; status?: string; sold_count?: number; view_count?: number; wishlist_count?: number }>
  const productById = new Map(productRows.map((p) => [p.id, p]))
  const activeProducts = productRows.filter((p) => (p.status ?? 'active') === 'active')

  // Catalog metrics (active only)
  const totalProducts = activeProducts.length
  const totalCategories = new Set(activeProducts.map((p) => p.category).filter(Boolean)).size
  const totalInventory = activeProducts.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0)

  // Low stock (≤ threshold), lowest first
  const lowStock: LowStockItem[] = activeProducts
    .filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= lowThreshold)
    .sort((a, b) => (a.stock_quantity || 0) - (b.stock_quantity || 0))
    .slice(0, 8)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock_quantity, image: p.images?.[0] ?? null }))

  // Orders / revenue for the selected range
  const rangeRows = (rangeOrders.data || []) as Array<{ total_amount: number; created_at: string; status: string }>
  const periodOrders = rangeRows.length
  const deliveredRange = rangeRows.filter((o) => REVENUE_STATUSES.includes(o.status))
  const monthlyRevenue = deliveredRange.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const prevMonthRevenue = ((prevOrders.data || []) as Array<{ total_amount: number; status: string }>)
    .filter((o) => REVENUE_STATUSES.includes(o.status))
    .reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const revenueGrowth = prevMonthRevenue > 0
    ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10
    : monthlyRevenue > 0 ? 100 : 0

  // Sales trend — daily delivered revenue over the range
  const byDay = new Map<string, number>()
  for (const o of deliveredRange) {
    const d = o.created_at.slice(0, 10)
    byDay.set(d, (byDay.get(d) || 0) + Number(o.total_amount || 0))
  }
  const salesTrend: SalesPoint[] = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, revenue]) => ({ date, revenue }))

  // Top selling categories + best selling (from delivered order items)
  const items = (deliveredItems.data || []) as Array<{ product_id: string | null; product_name: string; product_image: string | null; quantity: number }>
  const catQty = new Map<string, number>()
  const prodQty = new Map<string, { name: string; image: string | null; qty: number }>()
  let totalSoldQty = 0
  for (const it of items) {
    const q = Number(it.quantity) || 0
    totalSoldQty += q
    const cat = it.product_id ? productById.get(it.product_id)?.category || 'Other' : 'Other'
    catQty.set(cat, (catQty.get(cat) || 0) + q)
    const key = it.product_id || it.product_name
    const cur = prodQty.get(key) || { name: it.product_name, image: it.product_image, qty: 0 }
    cur.qty += q
    prodQty.set(key, cur)
  }
  const topCategories: TopCategory[] = [...catQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, qty]) => ({ category, qty, pct: pct(qty, totalSoldQty) }))

  // Best selling — units sold in the selected range; fall back to all-time sold_count
  const bestEntry = [...prodQty.entries()].sort((a, b) => b[1].qty - a[1].qty)[0]
  let bestSelling: ProductHighlight | null = bestEntry
    ? { id: bestEntry[0], name: bestEntry[1].name, image: bestEntry[1].image, value: bestEntry[1].qty }
    : null
  if (!bestSelling) {
    const bySold = [...productRows].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))[0]
    if (bySold && (bySold.sold_count || 0) > 0) bestSelling = { id: bySold.id, name: bySold.name, image: bySold.images?.[0] ?? null, value: bySold.sold_count || 0 }
  }

  // Most viewed — real view_count, fall back to review_count proxy
  const byViews = [...productRows].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0]
  const useViews = byViews && (byViews.view_count || 0) > 0
  const viewed = useViews ? byViews : [...productRows].sort((a, b) => (b.review_count || 0) - (a.review_count || 0))[0]
  const mostViewed: ProductHighlight | null = viewed
    ? { id: viewed.id, name: viewed.name, image: viewed.images?.[0] ?? null, value: useViews ? (viewed.view_count || 0) : (viewed.review_count || 0) }
    : null

  const wishlistAdds = productRows.reduce((s, p) => s + (p.wishlist_count || 0), 0)

  // Leads + conversion (graceful if table/columns missing)
  const leadRows = (leads.error ? [] : (leads.data || [])) as Array<{ id: string; status?: string }>
  const totalLeads = leadRows.length
  const newLeads = leadRows.filter((l) => !l.status || l.status === 'new').length
  const convertedLeads = leadRows.filter((l) => l.status === 'converted').length
  const conversionRate = pct(convertedLeads, totalLeads)

  return {
    totalProducts,
    totalCategories,
    totalInventory,
    todaysOrders: periodOrders,
    monthlyRevenue,
    prevMonthRevenue,
    revenueGrowth,
    salesTrend,
    topCategories,
    lowStock,
    newLeads,
    totalLeads,
    convertedLeads,
    conversionRate,
    wishlistAdds,
    bestSelling,
    mostViewed,
  }
}
