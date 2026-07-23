import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { buildWishlistEntries, parseWishKey } from '@/lib/wishlist-resolve'
import WishlistCard from '@/components/wishlist/WishlistCard'
import type { Product } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

async function loadShare(code: string) {
  const supabase = await createClient()
  const { data: shared } = await supabase
    .from('shared_wishlists')
    .select('owner_name, items')
    .eq('code', code)
    .single()
  if (!shared) return null

  const keys: string[] = Array.isArray(shared.items) ? shared.items : []
  const ids = Array.from(new Set(keys.map((k) => parseWishKey(k).id)))
  let products: Product[] = []
  if (ids.length > 0) {
    const { data } = await supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS).in('id', ids)
    products = (data as Product[]) || []
  }
  return { ownerName: shared.owner_name as string, entries: buildWishlistEntries(keys, products) }
}

// Possessive form: "Sainath" -> "Sainath's", "My" -> "My"
function possessiveTitle(name: string) {
  if (!name || name.toLowerCase() === 'my') return 'My Wishlist'
  return `${name}${name.endsWith('s') ? "'" : "'s"} Wishlist`
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const share = await loadShare(code)
  const title = share ? possessiveTitle(share.ownerName) : 'Wishlist'
  return { title: `${title} · Dyuthi Pattu Sarees` }
}

export default async function SharedWishlistPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const share = await loadShare(code)

  if (!share) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <Heart className="h-14 w-14 text-gray-200 mb-4" />
        <p className="text-lg font-semibold text-[#4E1E24] mb-1">Wishlist not found</p>
        <p className="text-sm text-gray-500 mb-6">This shared wishlist link is invalid or has expired.</p>
        <Link href="/products" className="inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
          Browse Sarees
        </Link>
      </div>
    )
  }

  const title = possessiveTitle(share.ownerName)

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-[#AD1457] fill-[#AD1457]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24]">{title}</h1>
          <span className="text-sm text-gray-500">({share.entries.length})</span>
        </div>
        <p className="text-sm text-gray-500 mb-6 md:mb-8">Shortlisted from Dyuthi Pattu Sarees</p>

        {share.entries.length === 0 ? (
          <p className="text-gray-500 py-16 text-center">These items are no longer available.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {share.entries.map((e) => (
              <WishlistCard key={e.key} product={e.product} image={e.image} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
