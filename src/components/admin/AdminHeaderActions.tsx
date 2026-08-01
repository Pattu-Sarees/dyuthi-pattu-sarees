'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAdminPrefs } from '@/lib/admin-prefs'
import { Bell, HelpCircle, ChevronDown, ShoppingCart, Users, AlertTriangle, XCircle, Boxes, BookOpen, LifeBuoy, ListChecks, UserCircle, KeyRound, Settings, LogOut, Check } from 'lucide-react'

interface Notif { id: string; type: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string }

const NOTIF_ICON: Record<string, { icon: typeof Bell; cls: string }> = {
  new_order: { icon: ShoppingCart, cls: 'text-green-600 bg-green-50' },
  new_lead: { icon: Users, cls: 'text-blue-600 bg-blue-50' },
  low_stock: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  order_cancelled: { icon: XCircle, cls: 'text-red-600 bg-red-50' },
  inventory_adjustment: { icon: Boxes, cls: 'text-purple-600 bg-purple-50' },
}

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return ref
}

export default function AdminHeaderActions({ email, name, avatar }: { email?: string | null; name?: string | null; avatar?: string | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [prefs] = useAdminPrefs()
  const [open, setOpen] = useState<'bell' | 'help' | 'profile' | null>(null)
  const [notifs, setNotifs] = useState<Notif[]>([])

  const load = () => {
    fetch('/api/admin/notifications').then((r) => r.json()).then(({ notifications }) => { setNotifs(notifications || []) }).catch(() => {})
  }

  // Respect the admin's notification preferences (mute categories).
  const enabled = (t: string) => prefs.notifications[t as keyof typeof prefs.notifications] !== false
  const visibleNotifs = notifs.filter((n) => enabled(n.type))
  const visibleUnread = notifs.filter((n) => !n.is_read && enabled(n.type)).length
  useEffect(() => {
    load()
    const t = setInterval(load, 60000) // refresh unread every minute
    return () => clearInterval(t)
  }, [])

  const markAll = async () => {
    setNotifs((p) => p.map((n) => ({ ...n, is_read: true })))
    await fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
  }
  const markOne = async (n: Notif) => {
    if (!n.is_read) {
      setNotifs((p) => p.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
    }
    if (n.link) { setOpen(null); router.push(n.link) }
  }

  const logout = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh() }

  const ref = useOutside(() => setOpen(null))

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto" ref={ref}>
      {/* Notification bell */}
      <div className="relative">
        <button onClick={() => setOpen(open === 'bell' ? null : 'bell')} className="relative text-gray-500 hover:text-[#AD1457]" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {visibleUnread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#AD1457] text-white text-[9px] rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center font-bold">{visibleUnread > 99 ? '99+' : visibleUnread}</span>}
        </button>
        {open === 'bell' && (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <span className="font-semibold text-sm text-[#4E1E24]">Notifications</span>
              {visibleUnread > 0 && <button onClick={markAll} className="text-[11px] text-[#AD1457] hover:underline flex items-center gap-1"><Check className="h-3 w-3" /> Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {visibleNotifs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No notifications</p>
              ) : visibleNotifs.map((n) => {
                const m = NOTIF_ICON[n.type] || { icon: Bell, cls: 'text-gray-500 bg-gray-50' }
                const Icon = m.icon
                return (
                  <button key={n.id} onClick={() => markOne(n)} className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 ${n.is_read ? '' : 'bg-rose-50/40'}`}>
                    <span className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.cls}`}><Icon className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-gray-800 truncate">{n.title}</span>
                      {n.body && <span className="block text-xs text-gray-500 truncate">{n.body}</span>}
                      <span className="block text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString('en-IN')}</span>
                    </span>
                    {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-[#AD1457] flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Help menu */}
      <div className="relative block">
        <button onClick={() => setOpen(open === 'help' ? null : 'help')} className="text-gray-500 hover:text-[#AD1457]" aria-label="Help"><HelpCircle className="h-5 w-5" /></button>
        {open === 'help' && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50 py-1">
            <MenuLink href="/admin/help/inventory-guide" icon={BookOpen} onClick={() => setOpen(null)}>Inventory Guide</MenuLink>
            <MenuLink href="/admin/help/order-lifecycle" icon={ListChecks} onClick={() => setOpen(null)}>Order Lifecycle</MenuLink>
            <MenuLink href="/contact" icon={LifeBuoy} onClick={() => setOpen(null)}>Contact Support</MenuLink>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative">
        <button onClick={() => setOpen(open === 'profile' ? null : 'profile')} className="flex items-center gap-2 pl-2 sm:border-l sm:border-gray-200">
          <span className="relative w-9 h-9 rounded-full overflow-hidden bg-[#4E1E24] text-[#F4E5C2] flex items-center justify-center text-sm font-semibold">
            {avatar ? <Image src={avatar} alt="" fill className="object-cover" sizes="36px" /> : (name?.[0] || email?.[0] || 'A').toUpperCase()}
          </span>
          <span className="hidden sm:block leading-tight text-left">
            <span className="block text-sm font-semibold text-[#4E1E24]">{name || 'Admin'}</span>
            <span className="block text-[11px] text-gray-400">Super Admin</span>
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
        </button>
        {open === 'profile' && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50 py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-[#4E1E24]">{name || 'Admin'}</p>
              <p className="text-[11px] text-gray-400 truncate">{email}</p>
            </div>
            <MenuLink href="/admin/profile" icon={UserCircle} onClick={() => setOpen(null)}>My Profile</MenuLink>
            <MenuLink href="/admin/profile/password" icon={KeyRound} onClick={() => setOpen(null)}>Change Password</MenuLink>
            <MenuLink href="/admin/preferences" icon={Settings} onClick={() => setOpen(null)}>Settings</MenuLink>
            <MenuLink href="/admin/activity" icon={ListChecks} onClick={() => setOpen(null)}>Activity Log</MenuLink>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        )}
      </div>
    </div>
  )
}

function MenuLink({ href, icon: Icon, onClick, children }: { href: string; icon: typeof Bell; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
      <Icon className="h-4 w-4 text-gray-400" /> {children}
    </Link>
  )
}
