import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PRODUCT_COLUMNS } from '@/lib/public-product-columns'
import { buildSharedCartEntries } from '@/lib/cart-share-resolve'
import type { SharedCartItem } from '@/app/api/cart/share/route'
import SharedCartView from '@/components/cart/SharedCartView'
import type { Product } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

async function loadShare(code: string) {
  const supabase = await createClient()
  const { data: shared } = await supabase
    .from('shared_carts')
    .select('owner_name, items')
    .eq('code', code)
    .single()
  if (!shared) return null

  const items: SharedCartItem[] = Array.isArray(shared.items) ? shared.items : []
  const ids = Array.from(new Set(items.map((i) => i.product_id)))
  let products: Product[] = []
  if (ids.length > 0) {
    const { data } = await supabase.from('products').select(PUBLIC_PRODUCT_COLUMNS).in('id', ids)
    products = (data as Product[]) || []
  }
  return { ownerName: shared.owner_name as string, entries: buildSharedCartEntries(items, products) }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const share = await loadShare(code)
  return { title: share ? `Cart-Share (${share.entries.length}) · Dyuthi Pattu Sarees` : 'Cart-Share · Dyuthi Pattu Sarees' }
}

export default async function SharedCartPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const share = await loadShare(code)

  if (!share) {
    return (
      <div className="bg-[#FFFDF7] min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag className="h-14 w-14 text-gray-200 mb-4" />
        <p className="text-lg font-semibold text-[#4E1E24] mb-1">Cart not found</p>
        <p className="text-sm text-gray-500 mb-6">This shared cart link is invalid or has expired.</p>
        <Link href="/products" className="inline-flex items-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-6 py-2.5 rounded-md transition-colors">
          Browse Sarees
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <SharedCartView entries={share.entries} ownerName={share.ownerName} />
      </div>
    </div>
  )
}
