'use client'

import { useEffect, useMemo, useState } from 'react'
import { Customer, Order } from '@/types'
import { Loader2, UserCircle, Search, X, Phone, ShoppingBag } from 'lucide-react'
import { useHighlight } from '@/lib/use-highlight'

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [viewing, setViewing] = useState<Customer | null>(null)
  const highlight = useHighlight('/admin/customers')

  useEffect(() => {
    fetch('/api/admin/customers').then((r) => r.json()).then(({ customers }) => { setCustomers(customers || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term))
  }, [customers, q])

  const totals = useMemo(() => ({
    count: customers.length,
    revenue: customers.reduce((s, c) => s + c.total_spending, 0),
  }), [customers])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Customers</h1>
        <div className="text-right text-xs text-gray-500">
          <p><span className="font-semibold text-gray-800">{totals.count}</span> customers</p>
          <p><span className="font-semibold text-gray-800">{inr(totals.revenue)}</span> lifetime</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone…" className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No customers yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-2 font-medium text-right">Orders</th>
                <th className="py-3 px-2 font-medium text-right">Spent</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Last order</th>
                <th className="py-3 px-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.phone} data-hl={c.phone} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 ${highlight === c.phone ? 'outline outline-2 -outline-offset-2 outline-red-500' : ''}`}>
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <a href={`tel:${c.phone}`} className="text-xs text-gray-500 flex items-center gap-1 hover:text-[#AD1457]"><Phone className="h-3 w-3" /> {c.phone}</a>
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-gray-700">{c.total_orders}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[#4E1E24]">{inr(c.total_spending)}</td>
                  <td className="py-2.5 px-2 text-gray-500 hidden sm:table-cell">{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button onClick={() => setViewing(c)} className="text-xs font-medium text-[#AD1457] hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <CustomerModal customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function CustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(customer.phone)}`).then((r) => r.json()).then(({ orders }) => setOrders(orders || [])).catch(() => setOrders([]))
  }, [customer.phone])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#4E1E24]">{customer.name}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>
          <span>{customer.total_orders} orders</span>
          <span className="font-semibold text-[#4E1E24]">{inr(customer.total_spending)} spent</span>
        </div>

        <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Order history</h3>
        {orders === null ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#AD1457]" /></div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No orders found.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">{o.order_number || o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')} · {(o.items?.length ?? 0)} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm tabular-nums">{inr(o.total_amount)}</p>
                  <span className="text-[11px] capitalize text-gray-500">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
