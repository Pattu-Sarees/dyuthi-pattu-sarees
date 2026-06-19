'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice, getStockStatus } from '@/lib/utils'
import { PlusCircle, Pencil, Trash2, Package, Loader2, Search, Eye, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then(({ products }) => { setProducts(products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) {
      toast.success('Product deleted')
      setProducts((p) => p.filter((x) => x.id !== id))
    } else {
      toast.error('Failed to delete')
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.in_stock).length,
    newArrivals: products.filter((p) => p.is_new_arrival).length,
    onSale: products.filter((p) => p.original_price).length,
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your saree catalog</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/admin/products/bulk">
            <span className="inline-flex items-center justify-center gap-2 border border-[#C2185B] text-[#C2185B] hover:bg-rose-50 font-semibold px-5 py-2.5 rounded-lg transition-colors w-full sm:w-auto">
              <ImagePlus className="h-5 w-5" /> Bulk Upload
            </span>
          </Link>
          <Link href="/admin/products/new">
            <span className="inline-flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors w-full sm:w-auto">
              <PlusCircle className="h-5 w-5" /> Add New Product
            </span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Products', value: stats.total },
          { label: 'In Stock', value: stats.inStock },
          { label: 'New Arrivals', value: stats.newArrivals },
          { label: 'On Sale', value: stats.onSale },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#C2185B]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products yet. Add your first saree!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="64px" />
                  ) : <div className="w-full h-full flex items-center justify-center text-2xl">🥻</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{p.category} • {p.fabric}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-bold text-[#C2185B]">{formatPrice(p.price)}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Stock: {p.stock_quantity}</span>
                    {(() => {
                      const s = getStockStatus(p.stock_quantity)
                      const cls = s.level === 'in' ? 'bg-green-50 text-green-600' : s.level === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{s.label}</span>
                    })()}
                    {p.is_new_arrival && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">New</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/products/${p.id}`} target="_blank" className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="View on store">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link href={`/admin/products/${p.id}/edit`} className="p-2 text-gray-500 hover:text-[#C2185B] hover:bg-rose-50 rounded-lg transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Inventory breakup */}
              {p.color_variants?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                  {p.color_variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-2.5 py-1">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {v.image ? <Image src={v.image} alt="" fill className="object-cover" sizes="24px" /> : null}
                      </div>
                      <span className="text-xs text-gray-700">{idx + 1}</span>
                      <span className="text-xs font-bold text-[#C2185B]">×{v.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
