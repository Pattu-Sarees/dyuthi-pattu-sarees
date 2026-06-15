'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user as { email: string } | null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user as { email: string } | null ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`)
      setSearch('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/products', label: 'All Sarees' },
    { href: '/products?category=silk', label: 'Silk' },
    { href: '/products?category=cotton', label: 'Cotton' },
    { href: '/products?category=banarasi', label: 'Banarasi' },
    { href: '/products?is_new_arrival=true', label: 'New Arrivals' },
    { href: '/products?is_featured=true', label: 'Featured' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#F7BE33] border-b border-amber-500/40 shadow-sm">
      {/* Top bar — scrolling marquee */}
      <div className="bg-rose-700 text-white text-xs py-1.5 overflow-hidden">
        <div className="marquee whitespace-nowrap">
          <span className="marquee-content">
            🚚 Enjoy free shipping on orders above ₹999&nbsp;&nbsp;•&nbsp;&nbsp;🧵 Handloom certified products&nbsp;&nbsp;•&nbsp;&nbsp;🪡 Direct from weavers&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span className="marquee-content" aria-hidden="true">
            🚚 Enjoy free shipping on orders above ₹999&nbsp;&nbsp;•&nbsp;&nbsp;🧵 Handloom certified products&nbsp;&nbsp;•&nbsp;&nbsp;🪡 Direct from weavers&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Dyuthi Pattu Sarees — Direct From Weavers"
              width={300}
              height={121}
              priority
              className="h-12 w-auto md:h-16"
            />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sarees, fabrics, occasions..."
                className="pl-10 pr-4 w-full"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2 hover:bg-rose-50 rounded-full transition-colors">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {totalItems()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1.5 p-2 hover:bg-rose-50 rounded-full transition-colors">
                  <User className="h-5 w-5 text-gray-700" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/account" className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Account</Link>
                  <Link href="/orders" className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Orders</Link>
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline" className="hidden sm:flex">Sign In</Button>
                <User className="h-5 w-5 text-gray-700 sm:hidden" />
              </Link>
            )}

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-[#7A2148]',
                pathname === link.href ? 'text-[#7A2148]' : 'text-[#4A2C17]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#F7BE33] border-t border-amber-500/40 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sarees..."
              className="flex-1"
            />
            <Button type="submit" size="sm">Search</Button>
          </form>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#4A2C17] hover:text-[#7A2148]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
