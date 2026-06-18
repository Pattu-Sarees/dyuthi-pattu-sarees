'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Heart, Truck, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LotusAccent from '@/components/ui/LotusAccent'
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
    { href: '/', label: 'Home' },
    { href: '/new-arrivals', label: 'New Arrivals' },
    { href: '/best-sellers', label: 'Best Sellers' },
    { href: '/on-sale', label: 'On Sale' },
    { href: '/products', label: 'All Collections' },
    { href: '/contact', label: 'Contact' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-50 bg-[#FAF3E8] border-b border-gray-100 shadow-sm">
      {/* Top bar — free shipping */}
      <div className="bg-[#C2185B] text-white text-xs md:text-sm py-2 px-4">
        <div className="flex items-center justify-center gap-2 font-medium tracking-wide">
          <Truck className="h-4 w-4 md:h-5 md:w-5" />
          <span>Enjoy Free Shipping All Over India</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Dyuthi Pattu Sarees — Direct From Weavers"
              width={396}
              height={100}
              priority
              className="h-12 w-auto md:h-16"
            />
          </Link>

          {/* Nav links — centered */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex flex-col items-center text-sm font-medium transition-colors hover:text-[#C2185B] whitespace-nowrap',
                    active ? 'text-[#C2185B]' : 'text-gray-700'
                  )}
                >
                  {link.label}
                  <LotusAccent
                    width={20}
                    className={cn('mt-1 transition-opacity', active ? 'opacity-100' : 'opacity-0')}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Right cluster: search first, then actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search — after nav links, before cart/login */}
            <form onSubmit={handleSearch} className="hidden md:flex md:mr-2">
              <div className="relative w-44 lg:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sarees..."
                  className="pl-10 pr-3 w-full h-9"
                />
              </div>
            </form>

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
                <button className="relative flex items-center p-2 hover:bg-rose-50 rounded-full transition-colors">
                  <User className="h-5 w-5 text-gray-700" />
                  <Sparkles className="absolute top-0 right-0 h-3 w-3 text-[#C2185B] fill-[#C2185B]" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/account" className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Account</Link>
                  <Link href="/orders" className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Orders</Link>
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="relative p-2 hover:bg-rose-50 rounded-full transition-colors" aria-label="Sign in">
                <User className="h-5 w-5 text-gray-700" />
                <Sparkles className="absolute top-0 right-0 h-3 w-3 text-[#C2185B] fill-[#C2185B]" />
              </Link>
            )}

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FFFDF7] border-t border-gray-100 px-4 py-4 space-y-3">
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
              className={cn(
                'flex items-center gap-2 py-2 text-sm font-medium hover:text-[#C2185B]',
                isActive(link.href) ? 'text-[#C2185B]' : 'text-gray-700'
              )}
            >
              {isActive(link.href) && <LotusAccent width={16} />}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
