'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, User, Menu, X, Heart, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { createClient } from '@/lib/supabase/client'
import SearchBox from './SearchBox'
import LotusAccent from '@/components/ui/LotusAccent'
import BrandLogo from './BrandLogo'
import AnnouncementBar from './AnnouncementBar'
import { cn } from '@/lib/utils'

export default function Navbar({
  logo = '/logo-v3.jpeg',
  announcement = { enabled: true, text: 'Enjoy Free Shipping All Over India' },
}: {
  logo?: string
  announcement?: { enabled: boolean; text: string }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const wishCount = useWishlistStore((s) => s.ids.length)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openCats, setOpenCats] = useState<string[]>([])
  const [collOpen, setCollOpen] = useState(false)
  const toggleCat = (t: string) => setOpenCats((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    // Proper-case a single word: "SAINATH"/"sainath" -> "Sainath".
    const properCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '')
    const loadName = (u: { id: string; email: string } | null) => {
      if (!u) { setFirstName(''); return }
      // Fallback: name portion of the email, letters only (strip digits & symbols).
      const emailName = (u.email || '').split('@')[0].replace(/[^a-zA-Z]/g, '')
      supabase.from('profiles').select('full_name').eq('id', u.id).single()
        .then(({ data: p }) => {
          const first = (p?.full_name || '').trim().split(/\s+/)[0] || emailName
          setFirstName(properCase(first))
        })
    }
    // getSession() reads the session locally (no auth-server round-trip), so the
    // header hydrates instantly on every page instead of waiting on a network call.
    supabase.auth.getSession().then(({ data }) => {
      const u = (data.session?.user as { id: string; email: string } | null) ?? null
      setUser(u)
      loadName(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = (session?.user as { id: string; email: string } | null) ?? null
      setUser(u)
      loadName(u)
    })
    // Refresh the displayed name right after the account page saves it.
    const onProfileUpdated = () => supabase.auth.getSession().then(({ data }) => loadName(data.session?.user as { id: string; email: string } | null))
    window.addEventListener('profile-updated', onProfileUpdated)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('profile-updated', onProfileUpdated)
    }
  }, [])

  // Close the account menu on outside click (needed for tap-to-open on mobile).
  useEffect(() => {
    if (!accountOpen) return
    const h = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [accountOpen])

  const handleSignOut = async () => {
    setAccountOpen(false)
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

  const collectionCols: { title: string; href?: string; items: { label: string; cat: string }[] }[] = [
    {
      title: 'Sarees',
      items: [
        { label: 'Mangalgiri', cat: 'mangalgiri' },
        { label: 'Kuppadam', cat: 'kuppadam' },
        { label: 'Gadwal', cat: 'gadwal' },
        { label: 'Kota', cat: 'kota' },
        { label: 'Kanchipattu', cat: 'kanchipattu' },
        { label: 'Soft Silks', cat: 'soft silks' },
      ],
    },
    {
      title: 'Other Sarees',
      items: [
        { label: 'Jamdhani', cat: 'jamdhani' },
        { label: 'Butter Silk', cat: 'butter silk' },
        { label: 'Green Mango', cat: 'green mango' },
      ],
    },
    { title: 'Lehengas', href: '/products?category=lehengas', items: [] },
    { title: 'Dress Materials', href: '/products?category=dress materials', items: [] },
  ]

  const searchRoutes = ['/', '/new-arrivals', '/best-sellers', '/on-sale', '/products']
  const showMobileSearch = searchRoutes.includes(pathname)

  return (
    <>
    <header className="sticky top-0 z-50 bg-[#F5EFE6] border-b border-gray-100 shadow-sm">
      {/* Top bar — auto-sliding announcement carousel */}
      {announcement.enabled && <AnnouncementBar />}

      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 md:gap-5 h-20 md:h-24">

          {/* Mobile menu hamburger — left side */}
          <button className="md:hidden p-2 -ml-2 flex-shrink-0 text-[#4E1E24]" onClick={() => { setMenuOpen(!menuOpen); setCollOpen(false) }} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <BrandLogo logo={logo} priority hoverZoom />
          </Link>

          {/* Nav links — centered */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              if (link.label === 'All Collections') {
                return (
                  <div key={link.href} className="relative group/coll">
                    <Link
                      href={link.href}
                      className={cn(
                        'relative flex flex-col items-center text-sm font-medium transition-colors hover:text-[#C2185B] whitespace-nowrap',
                        active ? 'text-[#C2185B]' : 'text-[#4E1E24]'
                      )}
                    >
                      {link.label}
                      <LotusAccent width={20} className={cn('mt-1 transition-opacity', active ? 'opacity-100' : 'opacity-0')} />
                    </Link>
                    {/* Mega menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover/coll:opacity-100 group-hover/coll:visible transition-all duration-150 z-50">
                      <div className="bg-[#FBF7F0] border-t border-[#e7ddcd] shadow-md p-8 grid grid-cols-4 gap-12 w-[760px]">
                        {collectionCols.map((col) => (
                          <div key={col.title}>
                            {col.href ? (
                              <Link href={col.href} className="block text-base font-bold text-[#4E1E24] hover:text-[#C2185B] mb-4">{col.title}</Link>
                            ) : (
                              <p className="text-base font-bold text-[#4E1E24] mb-4">{col.title}</p>
                            )}
                            <ul className="space-y-2.5">
                              {col.items.map((it) => (
                                <li key={it.cat}>
                                  <Link href={`/products?category=${encodeURIComponent(it.cat)}`} className="text-sm text-[#71474D] hover:text-[#C2185B] transition-colors">
                                    {it.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex flex-col items-center text-sm font-medium transition-colors hover:text-[#C2185B] whitespace-nowrap',
                    active ? 'text-[#C2185B]' : 'text-[#4E1E24]'
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
          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0 ml-auto">
            {/* Search — after nav links, before cart/login */}
            <div className="hidden md:flex md:mr-2">
              <SearchBox variant="desktop" />
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-1.5 md:p-2 hover:bg-rose-50 rounded-full transition-colors" aria-label="Wishlist">
              <Heart className="h-5 w-5 text-[#4E1E24]" />
              {mounted && wishCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative group" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  className="relative flex items-center p-1.5 md:p-2 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <User className="h-5 w-5 text-[#4E1E24]" />
                  <Sparkles className="absolute top-0 right-0 h-3 w-3 text-[#F59E0B] fill-[#F59E0B]" />
                </button>
                <div className={`absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 transition-all duration-200 z-50 ${accountOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} md:group-hover:opacity-100 md:group-hover:visible`}>
                  <div className="px-3 py-2 border-b border-gray-100">
                    {firstName && <p className="text-sm font-semibold text-[#4E1E24] truncate">{firstName}</p>}
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Account</Link>
                  <Link href="/orders" onClick={() => setAccountOpen(false)} className="block px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">My Orders</Link>
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="relative p-1.5 md:p-2 hover:bg-rose-50 rounded-full transition-colors" aria-label="Sign in">
                <User className="h-5 w-5 text-[#4E1E24]" />
                <Sparkles className="absolute top-0 right-0 h-3 w-3 text-[#F59E0B] fill-[#F59E0B]" />
              </Link>
            )}

            {/* Cart bag */}
            <Link href="/cart" id="cart-fly-target" className="relative p-1.5 md:p-2 hover:bg-rose-50 rounded-full transition-colors">
              <ShoppingBag className="h-5 w-5 text-[#4E1E24]" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#AD1457] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </div>

      {/* Mobile search bar — part of the sticky header so it never scrolls away
          on its own (and its dropdown always renders below a visible input). */}
      {showMobileSearch && (
        <div className="md:hidden bg-[#F5EFE6] border-t border-gray-100 px-4 pt-0 pb-2 -mt-1">
          <SearchBox variant="mobile" />
        </div>
      )}

      {/* Mobile navigation drawer — slide-in from left */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setMenuOpen(false); setCollOpen(false) }} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-[#F5EFE6] shadow-xl overflow-y-auto animate-drawer-slide">
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[#F5EFE6] border-b border-[#e7ddcd] z-10">
              <span className="font-semibold text-[#4E1E24]">Menu</span>
              <button onClick={() => { setMenuOpen(false); setCollOpen(false) }} aria-label="Close menu" className="p-1 rounded-lg hover:bg-black/5 text-[#4E1E24]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
          {!collOpen ? (
            <>
              {navLinks.map((link, i) =>
                link.href === '/products' ? (
                  <button
                    key={link.href}
                    onClick={() => setCollOpen(true)}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={cn(
                      'animate-drawer-item w-full flex items-center justify-between py-2 text-sm font-medium hover:text-[#C2185B]',
                      isActive(link.href) ? 'text-[#C2185B]' : 'text-[#4E1E24]'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isActive(link.href) && <LotusAccent width={16} />}
                      {link.label}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'animate-drawer-item flex items-center gap-2 py-2 text-sm font-medium hover:text-[#C2185B]',
                      isActive(link.href) ? 'text-[#C2185B]' : 'text-[#4E1E24]'
                    )}
                  >
                    {isActive(link.href) && <LotusAccent width={16} />}
                    {link.label}
                  </Link>
                )
              )}
            </>
          ) : (
            /* All Collections sub-panel (drill-down) */
            <div>
              <button
                onClick={() => setCollOpen(false)}
                className="flex items-center gap-2 py-2 text-base font-semibold text-[#4E1E24]"
              >
                <ChevronLeft className="h-5 w-5" />
                All Collections
              </button>
              <div className="mt-2">
                {collectionCols.map((col) =>
                  col.items.length > 0 ? (
                    <div key={col.title} className="border-b border-gray-200/70">
                      <button
                        onClick={() => toggleCat(col.title)}
                        className="w-full flex items-center justify-between py-3 text-sm font-medium text-[#4E1E24]"
                        aria-expanded={openCats.includes(col.title)}
                      >
                        {col.title}
                        <span className="text-lg leading-none text-[#4E1E24]">{openCats.includes(col.title) ? '−' : '+'}</span>
                      </button>
                      {openCats.includes(col.title) && (
                        <div className="pb-2">
                          {col.items.map((it) => (
                            <Link
                              key={it.cat}
                              href={`/products?category=${encodeURIComponent(it.cat)}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-1.5 text-sm text-gray-600 hover:text-[#C2185B]"
                            >
                              {it.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={col.title}
                      href={col.href!}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-sm font-medium text-[#4E1E24] border-b border-gray-200/70 hover:text-[#C2185B]"
                    >
                      {col.title}
                    </Link>
                  )
                )}
              </div>

              <Link
                href="/products"
                onClick={() => { setMenuOpen(false); setCollOpen(false) }}
                className="mt-4 flex items-center justify-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-2.5 rounded-md transition-colors"
              >
                View All
              </Link>
            </div>
          )}
            </div>
          </div>
        </div>
      )}

    </header>
    </>
  )
}
