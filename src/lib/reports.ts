import { createAdminClient } from '@/lib/supabase/admin'

export const REPORT_TYPES = ['sales', 'orders', 'inventory', 'leads', 'revenue'] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export interface ReportResult {
  columns: string[]
  rows: (string | number)[][]
  summary: Record<string, string | number>
}

export interface ReportFilters {
  type: ReportType
  from?: string | null   // ISO date (inclusive)
  to?: string | null     // ISO date (inclusive)
  category?: string | null
}

const inr = (n: number) => Math.round(Number(n || 0))

function rangeBounds(from?: string | null, to?: string | null) {
  const start = from ? new Date(from + 'T00:00:00').toISOString() : null
  const end = to ? new Date(to + 'T23:59:59.999').toISOString() : null
  return { start, end }
}

export async function buildReport(filters: ReportFilters): Promise<ReportResult> {
  const db = createAdminClient()
  const { start, end } = rangeBounds(filters.from, filters.to)
  const inRange = <T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(q: T, col = 'created_at') => {
    let r = q
    if (start) r = r.gte(col, start)
    if (end) r = r.lte(col, end)
    return r
  }

  switch (filters.type) {
    case 'revenue':
    case 'sales': {
      // Delivered orders grouped by day
      const { data } = await inRange(db.from('orders').select('created_at,total_amount,status')).eq('status', 'delivered')
      const byDay = new Map<string, { revenue: number; orders: number }>()
      for (const o of (data || []) as Array<{ created_at: string; total_amount: number }>) {
        const d = o.created_at.slice(0, 10)
        const cur = byDay.get(d) || { revenue: 0, orders: 0 }
        cur.revenue += Number(o.total_amount || 0); cur.orders += 1
        byDay.set(d, cur)
      }
      const rows = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => [d, v.orders, inr(v.revenue)])
      const totalRev = rows.reduce((s, r) => s + Number(r[2]), 0)
      const totalOrders = rows.reduce((s, r) => s + Number(r[1]), 0)
      return {
        columns: ['Date', 'Delivered Orders', 'Revenue (₹)'],
        rows,
        summary: { 'Total Revenue': '₹' + totalRev.toLocaleString('en-IN'), 'Delivered Orders': totalOrders, 'Avg Order Value': totalOrders ? '₹' + Math.round(totalRev / totalOrders).toLocaleString('en-IN') : '₹0' },
      }
    }
    case 'orders': {
      const { data } = await inRange(db.from('orders').select('order_number,customer_name,customer_phone,total_amount,status,payment_status,created_at'))
      const rows = ((data || []) as Array<Record<string, unknown>>)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .map((o) => [
          (o.order_number as string) || '—',
          (o.customer_name as string) || '—',
          (o.customer_phone as string) || '—',
          inr(o.total_amount as number),
          (o.status as string) || '',
          (o.payment_status as string) || '',
          String(o.created_at).slice(0, 10),
        ])
      const total = rows.reduce((s, r) => s + Number(r[3]), 0)
      return {
        columns: ['Order #', 'Customer', 'Phone', 'Total (₹)', 'Status', 'Payment', 'Date'],
        rows,
        summary: { 'Total Orders': rows.length, 'Total Value': '₹' + total.toLocaleString('en-IN') },
      }
    }
    case 'inventory': {
      let q = db.from('products').select('name,category,stock_quantity,sold_count,price,status')
      if (filters.category) q = q.eq('category', filters.category)
      const { data } = await q.order('stock_quantity', { ascending: true })
      const rows = ((data || []) as Array<Record<string, unknown>>).map((p) => [
        (p.name as string) || '',
        (p.category as string) || '',
        Number(p.stock_quantity || 0),
        Number(p.sold_count || 0),
        inr(p.price as number),
        (p.status as string) || 'active',
      ])
      const totalStock = rows.reduce((s, r) => s + Number(r[2]), 0)
      const stockValue = rows.reduce((s, r) => s + Number(r[2]) * Number(r[4]), 0)
      return {
        columns: ['Product', 'Category', 'Stock', 'Sold', 'Price (₹)', 'Status'],
        rows,
        summary: { 'Products': rows.length, 'Total Stock': totalStock, 'Stock Value': '₹' + stockValue.toLocaleString('en-IN') },
      }
    }
    case 'leads': {
      const { data } = await inRange(db.from('leads').select('name,phone,source,status,follow_up_date,created_at'))
      const rows = ((data || []) as Array<Record<string, unknown>>)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .map((l) => [
          (l.name as string) || '',
          (l.phone as string) || '—',
          (l.source as string) || '',
          (l.status as string) || '',
          (l.follow_up_date as string) || '—',
          String(l.created_at).slice(0, 10),
        ])
      const converted = rows.filter((r) => r[3] === 'converted').length
      return {
        columns: ['Name', 'Phone', 'Source', 'Status', 'Follow-up', 'Created'],
        rows,
        summary: { 'Total Leads': rows.length, 'Converted': converted, 'Conversion %': rows.length ? Math.round((converted / rows.length) * 1000) / 10 : 0 },
      }
    }
  }
}

export function toCSV(result: ReportResult): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [result.columns.map(esc).join(',')]
  for (const row of result.rows) lines.push(row.map(esc).join(','))
  return lines.join('\n')
}
