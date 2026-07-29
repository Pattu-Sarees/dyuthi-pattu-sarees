'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// Shared Cart ↔ Delivery path — lets the user jump back and forth between the
// two checkout steps the same way the product-page breadcrumb works.
export default function CheckoutBreadcrumb({ active }: { active: 'cart' | 'delivery' }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      <Link href="/cart" className={active === 'cart' ? 'text-gray-900 font-semibold' : 'hover:text-rose-600 transition-colors'}>
        My Cart
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/checkout" className={active === 'delivery' ? 'text-gray-900 font-semibold' : 'hover:text-rose-600 transition-colors'}>
        Delivery
      </Link>
    </nav>
  )
}
