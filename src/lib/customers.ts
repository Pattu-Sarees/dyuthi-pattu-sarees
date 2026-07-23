import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, Order } from '@/types'

// Customers are derived from the orders table, grouped by phone number.
// A "customer" is anyone who has placed at least one order.

interface OrderRow {
  id: string
  order_number: string | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  status: string
  created_at: string
  address: { phone?: string; name?: string } | null
}

function phoneOf(o: OrderRow): string | null {
  return (o.customer_phone || o.address?.phone || '').trim() || null
}
function nameOf(o: OrderRow): string {
  return (o.customer_name || o.address?.name || 'Guest').trim() || 'Guest'
}

export async function getCustomers(): Promise<Customer[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, total_amount, status, created_at, address')
    .order('created_at', { ascending: false })

  if (error) return []

  const byPhone = new Map<string, Customer>()
  for (const o of (data || []) as OrderRow[]) {
    const phone = phoneOf(o)
    if (!phone) continue
    const existing = byPhone.get(phone)
    const isDelivered = o.status === 'delivered'
    const spend = isDelivered ? Number(o.total_amount || 0) : 0

    if (!existing) {
      byPhone.set(phone, {
        phone,
        name: nameOf(o),
        email: null,
        total_orders: 1,
        total_spending: spend,
        last_order_at: o.created_at,
        first_order_at: o.created_at,
      })
    } else {
      existing.total_orders += 1
      existing.total_spending += spend
      // rows are newest-first, so first seen = last_order_at; keep updating first_order_at
      existing.first_order_at = o.created_at
    }
  }

  return [...byPhone.values()].sort((a, b) => b.total_spending - a.total_spending)
}

export async function getCustomerOrders(phone: string): Promise<Order[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('orders')
    .select('*, items:order_items(*)')
    .or(`customer_phone.eq.${phone},address->>phone.eq.${phone}`)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as unknown as Order[]
}
