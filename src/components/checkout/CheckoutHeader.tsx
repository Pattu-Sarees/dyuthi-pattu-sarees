'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import BrandLogo from '@/components/layout/BrandLogo'
import { useCartStore } from '@/store/cart'

// Minimal header for the checkout / Delivery page: brand logo on the left,
// a single cart icon on the right (links back to the cart). No full navbar.
export default function CheckoutHeader({ logo }: { logo?: string }) {
  const items = useCartStore((s) => s.items)
  const count = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Dyuthi Pattu Sarees home" className="flex items-center">
          <BrandLogo logo={logo} priority compact />
        </Link>
        <Link href="/cart" aria-label="View cart" className="relative p-2 text-[#4E1E24] hover:text-[#C2185B] transition-colors">
          <ShoppingBag className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-[#C2185B] text-white text-[10px] font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
