'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { DashboardMetrics } from '@/lib/dashboard'
import DateRangeFilter, { computeRange, presetLabel, type RangePreset, type CustomRange } from '@/components/admin/DateRangeFilter'
import { useAdminPrefs, type DashboardPeriod } from '@/lib/admin-prefs'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag, Layers, Boxes, ShoppingCart, IndianRupee, ArrowUp, ArrowDown, Heart, TrendingUp, Users,
  PlusCircle, FilePlus, MessageSquare, LayoutTemplate, BarChart3, Trophy, Eye,
} from 'lucide-react'

const DONUT_COLORS = ['#AD1457', '#E5739E', '#B8860B', '#1f8a5b', '#C2185B', '#cbb6a6']

const actions = [
  { label: 'Add New Product', href: '/admin/products/new', icon: PlusCircle, primary: true },
  { label: 'Create New Order', href: '/admin/orders', icon: FilePlus },
  { label: 'Manage Leads', href: '/admin/leads', icon: MessageSquare },
  { label: 'Homepage Sections', href: '#', icon: LayoutTemplate },
  { label: 'View Reports', href: '#', icon: BarChart3 },
]

function lakh(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return formatPrice(n)
}

function Delta({ value, label }: { value: number; label: string }) {
  if (value === 0) return <p className="text-xs text-gray-400 mt-1">{label}</p>
  const up = value > 0
  return (
    <p className={`flex items-center gap-1 text-xs mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {Math.abs(value)}% {label}
    </p>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
}

export default function AdminDashboard() {
  const [m, setM] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Admin')
  const [prefs, setPrefs] = useAdminPrefs()

  // Logged-in admin's name for the welcome line.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const n = data.user?.user_metadata?.full_name?.trim() || data.user?.email?.split('@')[0]
      if (n) setAdminName(n)
    })
  }, [])
  // Preset comes from the profile "Default Dashboard Period"; a custom range
  // (session-only) overrides it while active.
  const [custom, setCustom] = useState<CustomRange | null>(null)
  const preset: RangePreset = custom ? 'custom' : prefs.dashboard.period
  const period = prefs.dashboard.period

  const onRange = (p: RangePreset, c?: CustomRange) => {
    if (p === 'custom' && c) { setCustom(c) }
    else { setCustom(null); setPrefs({ ...prefs, dashboard: { ...prefs.dashboard, period: p as DashboardPeriod } }) }
  }

  // Fetch metrics whenever the period (or custom range) changes.
  useEffect(() => {
    const id = setTimeout(() => {
      const p: RangePreset = custom ? 'custom' : period
      if (p === 'custom' && (!custom?.start || !custom?.end)) return
      const { from, to } = computeRange(p, custom || undefined)
      setLoading(true)
      fetch(`/api/admin/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`)
        .then((r) => r.json())
        .then((d) => { if (!d.error) setM(d) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(id)
  }, [period, custom])

  const stats = [
    { label: 'Total Products', value: m?.totalProducts ?? 0, icon: ShoppingBag, sub: 'in catalog' },
    { label: 'Total Categories', value: m?.totalCategories ?? 0, icon: Layers, sub: 'active' },
    { label: 'Total Inventory', value: (m?.totalInventory ?? 0).toLocaleString('en-IN'), icon: Boxes, sub: 'units in stock' },
    { label: 'Orders', value: m?.todaysOrders ?? 0, icon: ShoppingCart, sub: presetLabel(preset) },
    { label: 'Revenue', value: m ? formatPrice(m.monthlyRevenue) : '₹0', icon: IndianRupee, delta: m?.revenueGrowth ?? 0 },
  ]

  // Sales trend
  const trend = m?.salesTrend ?? []
  const smax = Math.max(1, ...trend.map((t) => t.revenue))
  const salesPts = trend.length > 1
    ? trend.map((t, i) => `${(i / (trend.length - 1)) * 300},${110 - (t.revenue / smax) * 100}`).join(' ')
    : ''

  // Donut
  let off = 0
  const segs = (m?.topCategories ?? []).map((d, i) => { const s = { ...d, color: DONUT_COLORS[i % DONUT_COLORS.length], offset: off }; off += d.pct; return s })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="text-[#AD1457] font-medium capitalize">{adminName}!</span> Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <DateRangeFilter preset={preset} custom={custom || { start: '', end: '' }} onChange={onRange} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_18rem] gap-4">
        <div className="space-y-4 min-w-0">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-9 h-9 rounded-full bg-rose-50 text-[#AD1457] flex items-center justify-center"><s.icon className="h-5 w-5" /></span>
                  <span className="text-xs font-medium text-gray-500">{s.label}</span>
                </div>
                {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-[#4E1E24]">{s.value}</p>}
                {'delta' in s ? <Delta value={s.delta as number} label="vs previous" /> : <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Sales + categories + low stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-[#4E1E24] mb-2">Sales Overview</h2>
              <p className="text-xs text-gray-400">Total Revenue ({presetLabel(preset)})</p>
              {loading ? <Skeleton className="h-6 w-28 my-1" /> : <p className="text-xl font-bold text-[#4E1E24]">{formatPrice(m?.monthlyRevenue ?? 0)}</p>}
              <Delta value={m?.revenueGrowth ?? 0} label="vs previous period" />
              {salesPts ? (
                <div className="flex gap-2 mt-2">
                  <svg viewBox="0 0 300 110" className="flex-1 h-28">
                    <polyline points={`0,110 ${salesPts} 300,110`} fill="#AD1457" fillOpacity="0.08" stroke="none" />
                    <polyline points={salesPts} fill="none" stroke="#AD1457" strokeWidth="2" />
                  </svg>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-8 text-center">No delivered orders in this period yet.</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-[#4E1E24] mb-3">Top Selling Categories</h2>
              {segs.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No sales recorded yet.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      {segs.map((seg) => (<circle key={seg.category} cx="18" cy="18" r="15.915" fill="none" stroke={seg.color} strokeWidth="4.5" strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={`${-seg.offset}`} />))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-gray-400">Total Sales</span>
                      <span className="text-sm font-bold text-[#4E1E24]">{lakh(m?.monthlyRevenue ?? 0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {segs.map((seg) => (
                      <div key={seg.category} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        <span className="capitalize text-gray-700 flex-1 truncate">{seg.category}</span>
                        <span className="font-medium text-gray-500">{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#4E1E24]">Low Stock Alerts</h2>
                <Link href="/admin/products" className="text-[11px] text-[#AD1457] font-medium">View All</Link>
              </div>
              {loading ? (
                <div className="space-y-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : (m?.lowStock?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">All well stocked</p>
              ) : (
                <div className="space-y-2.5">
                  {m!.lowStock.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <div className="relative w-9 h-11 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="36px" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-red-500">Stock: {p.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1"><Heart className="h-4 w-4 text-[#AD1457]" /><span className="text-xs text-gray-500">Wishlist Adds</span></div>
              <p className="text-xl font-bold text-[#4E1E24]">{m?.wishlistAdds ?? 0}</p>
              <p className="text-[10px] text-gray-400">total saves</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-[#AD1457]" /><span className="text-xs text-gray-500">Conversion Rate</span></div>
              <p className="text-xl font-bold text-[#4E1E24]">{m ? `${m.conversionRate}%` : '—'}</p>
              <p className="text-[10px] text-gray-400">{m?.totalLeads ?? 0} leads</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-[#AD1457]" /><span className="text-xs text-gray-500">New Leads</span></div>
              <p className="text-xl font-bold text-[#4E1E24]">{m?.newLeads ?? 0}</p>
              <p className="text-[10px] text-gray-400">status: new</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2"><Trophy className="h-4 w-4 text-[#B8860B]" /><span className="text-xs text-gray-500">Best Selling</span></div>
              {m?.bestSelling ? (
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">{m.bestSelling.image ? <Image src={m.bestSelling.image} alt="" fill className="object-cover" sizes="40px" /> : null}</div>
                  <div><p className="text-xs text-gray-800 leading-tight line-clamp-2">{m.bestSelling.name}</p><p className="text-[11px] text-gray-400 mt-0.5">Sold: {m.bestSelling.value}</p></div>
                </div>
              ) : <p className="text-xs text-gray-400">No sales yet</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2"><Eye className="h-4 w-4 text-[#AD1457]" /><span className="text-xs text-gray-500">Most Viewed</span></div>
              {m?.mostViewed ? (
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">{m.mostViewed.image ? <Image src={m.mostViewed.image} alt="" fill className="object-cover" sizes="40px" /> : null}</div>
                  <div><p className="text-xs text-gray-800 leading-tight line-clamp-2">{m.mostViewed.name}</p><p className="text-[11px] text-gray-400 mt-0.5">{m.mostViewed.value} views</p></div>
                </div>
              ) : <p className="text-xs text-gray-400">—</p>}
            </div>
          </div>
        </div>

        {/* RIGHT RAIL */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-[#4E1E24] mb-3">Quick Actions</h2>
            <div className="divide-y divide-gray-100">
              {actions.map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-3 py-2.5 text-sm text-[#4E1E24] hover:text-[#AD1457] transition-colors first:pt-0 last:pb-0">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${a.primary ? 'bg-[#AD1457] text-white' : 'bg-rose-50 text-[#AD1457]'}`}><a.icon className="h-4 w-4" /></span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-[#4E1E24] mb-3">Quick Stats</h2>
            <div className="space-y-3">
              <QuickStat label="New Leads" value={`${m?.newLeads ?? 0}`} icon={Users} />
              <QuickStat label="Wishlist Adds" value={`${m?.wishlistAdds ?? 0}`} icon={Heart} />
              <QuickStat label="Conversion Rate" value={m ? `${m.conversionRate}%` : '—'} icon={TrendingUp} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">© {new Date().getFullYear()} Dyuthi Pattu Sarees. All rights reserved.</p>
    </div>
  )
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="w-7 h-7 rounded-full bg-rose-50 text-[#AD1457] flex items-center justify-center"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="text-xl font-bold text-[#4E1E24] mt-1">{value}</p>
    </div>
  )
}
