'use client'

import { useEffect, useState } from 'react'
import { Loader2, ListChecks, Package, Boxes, ShoppingCart, RefreshCw, UserCheck, LayoutGrid, PencilLine } from 'lucide-react'

interface Log { id: string; admin_email: string | null; action: string; entity: string | null; entity_id: string | null; detail: string | null; created_at: string }

const ACTION_META: Record<string, { label: string; icon: typeof Package; cls: string }> = {
  product_created: { label: 'Product created', icon: Package, cls: 'text-green-600 bg-green-50' },
  product_updated: { label: 'Product updated', icon: PencilLine, cls: 'text-blue-600 bg-blue-50' },
  inventory_adjusted: { label: 'Inventory adjusted', icon: Boxes, cls: 'text-purple-600 bg-purple-50' },
  order_created: { label: 'Order created', icon: ShoppingCart, cls: 'text-green-600 bg-green-50' },
  order_status_changed: { label: 'Order status changed', icon: RefreshCw, cls: 'text-amber-600 bg-amber-50' },
  lead_converted: { label: 'Lead converted', icon: UserCheck, cls: 'text-[#AD1457] bg-rose-50' },
  category_created: { label: 'Category created', icon: LayoutGrid, cls: 'text-indigo-600 bg-indigo-50' },
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity').then((r) => r.json()).then(({ logs }) => { setLogs(logs || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-5" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Activity Log</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {logs.map((l) => {
            const m = ACTION_META[l.action] || { label: l.action, icon: ListChecks, cls: 'text-gray-500 bg-gray-50' }
            const Icon = m.icon
            return (
              <div key={l.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.cls}`}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800"><span className="font-medium">{m.label}</span>{l.detail ? <span className="text-gray-500"> — {l.detail}</span> : null}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{l.admin_email || 'system'} · {new Date(l.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
