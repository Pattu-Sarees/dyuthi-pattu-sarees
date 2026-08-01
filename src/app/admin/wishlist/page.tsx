'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Heart, Eye } from 'lucide-react'

interface Row { id: string; name: string; image: string | null; category: string; count: number }

export default function AdminWishlistPage() {
  const [data, setData] = useState<{ totalAdds: number; top: Row[]; mostViewed: Row[] } | null>(null)

  useEffect(() => {
    fetch('/api/admin/wishlist').then((r) => r.json()).then(setData).catch(() => setData({ totalAdds: 0, top: [], mostViewed: [] }))
  }, [])

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-5" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Wishlist Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2 sm:mb-5">
        <Stat icon={<Heart className="h-4 w-4" />} label="Total Wishlist Adds" value={data.totalAdds} />
        <Stat icon={<Heart className="h-4 w-4" />} label="Wishlisted Products" value={data.top.length} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Viewed Products" value={data.mostViewed.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <RankList title="Top Wishlisted Sarees" icon={<Heart className="h-4 w-4 text-[#AD1457]" />} rows={data.top} unit="adds" />
        <RankList title="Most Viewed Sarees" icon={<Eye className="h-4 w-4 text-[#AD1457]" />} rows={data.mostViewed} unit="views" />
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-2.5 sm:p-4">
      <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 text-[10px] sm:text-[11px] uppercase tracking-wide">{icon} {label}</div>
      <p className="text-lg sm:text-2xl font-bold text-[#4E1E24] tabular-nums mt-0.5 sm:mt-1">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

function RankList({ title, icon, rows, unit }: { title: string; icon: React.ReactNode; rows: Row[]; unit: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h2 className="flex items-center gap-1.5 font-semibold text-gray-900 mb-3">{icon} {title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/products/${r.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg -mx-1 px-1 py-1 hover:bg-rose-50/50 transition-colors"
            >
              <span className="w-5 text-xs font-semibold text-gray-300 tabular-nums">{i + 1}</span>
              <span className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 block">
                {r.image && <Image src={r.image} alt={r.name} fill className="object-cover" sizes="40px" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                <p className="text-[11px] text-gray-400 capitalize">{r.category}</p>
              </div>
              <span className="text-sm font-semibold text-[#AD1457] tabular-nums flex-shrink-0">{r.count} <span className="text-[11px] font-normal text-gray-400">{unit}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
