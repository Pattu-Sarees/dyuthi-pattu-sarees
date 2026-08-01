'use client'

import { useEffect, useState } from 'react'
import { Loader2, BarChart3, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

const REPORTS = [
  { key: 'sales', label: 'Sales' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'leads', label: 'Leads' },
] as const

const input = 'h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

interface ReportResult { columns: string[]; rows: (string | number)[][]; summary: Record<string, string | number> }

export default function AdminReportsPage() {
  const [type, setType] = useState<string>('sales')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<{ name: string }[]>([])
  const [result, setResult] = useState<ReportResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => r.json()).then(({ categories }) => setCategories(categories || [])).catch(() => {})
  }, [])

  const qs = () => {
    const p = new URLSearchParams({ type })
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (category && type === 'inventory') p.set('category', category)
    return p.toString()
  }

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?${qs()}`)
      if (!res.ok) throw new Error()
      setResult(await res.json())
    } catch { toast.error('Failed to generate report') } finally { setLoading(false) }
  }

  // Auto-load when the report type changes (no synchronous setState in the effect body).
  useEffect(() => {
    let active = true
    const p = new URLSearchParams({ type })
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (category && type === 'inventory') p.set('category', category)
    fetch(`/api/admin/reports?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { if (active) setResult(data) })
      .catch(() => { if (active) toast.error('Failed to generate report') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const exportFile = (format: 'csv' | 'excel') => {
    window.open(`/api/admin/reports?${qs()}&format=${format}`, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => exportFile('csv')} disabled={!result?.rows.length} className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-200 bg-white px-3 py-2 rounded-lg hover:border-[#AD1457] transition-colors disabled:opacity-40"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => exportFile('excel')} disabled={!result?.rows.length} className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-200 bg-white px-3 py-2 rounded-lg hover:border-[#AD1457] transition-colors disabled:opacity-40"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => setType(r.key)} className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors ${type === r.key ? 'bg-[#AD1457] text-white border-[#AD1457]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#AD1457]'}`}>{r.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5 bg-white rounded-xl border border-gray-100 p-4">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </div>
        {type === 'inventory' && (
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={run} className="inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors h-10">Generate</button>
      </div>

      {/* Summary */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {Object.entries(result.summary).map(([k, v]) => (
            <div key={k} className="bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">{k}</p>
              <p className="text-lg font-bold text-[#4E1E24] tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>
      ) : !result || result.rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No data for this report and range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                {result.columns.map((c) => <th key={c} className="py-3 px-4 font-medium whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  {row.map((cell, j) => <td key={j} className="py-2.5 px-4 whitespace-nowrap text-gray-700">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
