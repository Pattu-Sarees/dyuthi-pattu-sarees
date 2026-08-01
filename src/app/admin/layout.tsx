import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { ShieldX } from 'lucide-react'
import AdminGate from '@/components/admin/AdminGate'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeaderActions from '@/components/admin/AdminHeaderActions'
import AdminMain from '@/components/admin/AdminMain'
import GlobalSearch from '@/components/admin/GlobalSearch'

export const metadata = { title: 'Admin | Dyuthi Pattu Sarees', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not signed in → show the admin email/OTP gate (verifies against ADMIN_EMAILS)
  if (!user) return <AdminGate />

  // Signed in but not an admin → restricted message, no admin UI
  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <ShieldX className="h-8 w-8 text-[#C2185B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You cannot access this page</h1>
          <p className="text-gray-500 mb-6">
            This area is restricted. You don&apos;t have permission to view it.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Go to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center h-16">
          {/* Desktop: full logo + wordmark on white, matching the storefront header */}
          <Link href="/admin" className="flex-shrink-0 hidden md:flex items-center gap-2 h-16 pl-4 pr-6">
            <span className="relative flex-shrink-0 overflow-hidden rounded-md h-12 w-12">
              <Image src="/logo-v3.jpeg" alt="Dyuthi Pattu Sarees" width={256} height={256} priority className="h-full w-full object-cover scale-[1.35]" />
            </span>
            <span className="leading-tight flex flex-col items-stretch w-fit">
              <span className="block text-lg font-bold tracking-wide text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
                Dyuthi Pattu Sarees
              </span>
              <span className="flex w-full items-center justify-center gap-1.5 text-[10px] tracking-wide text-[#A88C57]">
                <span aria-hidden className="h-px flex-1 min-w-0" style={{ background: 'linear-gradient(to right, transparent, #C9A227)' }} />
                <span aria-hidden className="h-[4px] w-[4px] rotate-45 flex-shrink-0" style={{ backgroundColor: '#C9A227' }} />
                <span className="flex-shrink-0">Looms to Homes</span>
                <span aria-hidden className="h-[4px] w-[4px] rotate-45 flex-shrink-0" style={{ backgroundColor: '#C9A227' }} />
                <span aria-hidden className="h-px flex-1 min-w-0" style={{ background: 'linear-gradient(to left, transparent, #C9A227)' }} />
              </span>
            </span>
          </Link>
          {/* Mobile: compact icon only */}
          <Link href="/admin" className="flex-shrink-0 md:hidden pl-3 pr-1">
            <span className="relative flex-shrink-0 overflow-hidden rounded-md h-9 w-9 block">
              <Image src="/logo-v3.jpeg" alt="Dyuthi Pattu Sarees" width={160} height={160} priority className="h-full w-full object-cover scale-[1.35]" />
            </span>
          </Link>
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-1 px-2 sm:px-4">
            <GlobalSearch />
            <AdminHeaderActions email={user.email} name={user.user_metadata?.full_name} avatar={user.user_metadata?.avatar_url} />
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar />
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  )
}
