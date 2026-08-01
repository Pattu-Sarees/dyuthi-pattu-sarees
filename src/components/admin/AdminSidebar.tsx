'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Package, Boxes, Handshake, ShoppingCart, Users, Heart, LayoutTemplate, UserCircle, Ticket, BarChart3, LayoutGrid, MessageSquareQuote, Settings, Store, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { loadPrefs } from '@/lib/admin-prefs'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/vendors', label: 'Vendors', icon: Handshake },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/wishlist', label: 'Wishlist Analytics', icon: Heart },
  { href: '/admin/homepage', label: 'Homepage', icon: LayoutTemplate },
  { href: '/admin/customers', label: 'Customers', icon: UserCircle },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'View Store', icon: Store },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  // Default state: collapsed on mobile; on desktop follow the admin's Appearance preference.
  useEffect(() => {
    const id = setTimeout(() => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      setCollapsed(isMobile || loadPrefs().appearance.sidebar === 'collapsed')
    }, 0)
    return () => clearTimeout(id)
  }, [])

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className={cn('flex-shrink-0 bg-[#3a0d22] h-[calc(100vh-4rem)] overflow-y-auto sticky top-16 flex flex-col p-2 md:p-3 transition-[width]', collapsed ? 'w-12 md:w-16' : 'w-44 md:w-56')}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="self-end mb-1 p-1.5 rounded-lg text-[#E8DCC7] hover:bg-white/10 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
      <nav className="space-y-0.5">
        {NAV.map((n, i) => {
          const active = n.href !== '#' && isActive(n.href)
          return (
            <Link
              key={`${n.label}-${i}`}
              href={n.href}
              title={collapsed ? n.label : undefined}
              className={cn(
                'flex items-center gap-2.5 md:gap-3 rounded-lg text-[13px] md:text-sm transition-colors',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-1.5 md:px-3.5 md:py-2',
                active ? 'bg-[#F4E5C2] text-[#4E1E24] font-semibold' : 'text-[#E8DCC7] hover:bg-white/10'
              )}
            >
              <n.icon className="h-4 w-4 flex-shrink-0" /> {!collapsed && n.label}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        title={collapsed ? 'Logout' : undefined}
        className={cn('mt-auto flex items-center gap-2.5 md:gap-3 rounded-lg text-[13px] md:text-sm text-[#E8DCC7] hover:bg-white/10 transition-colors', collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2 md:px-3.5 md:py-2.5')}
      >
        <LogOut className="h-4 w-4 flex-shrink-0" /> {!collapsed && 'Logout'}
      </button>
    </aside>
  )
}
