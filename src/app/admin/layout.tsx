import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { LayoutDashboard, PlusCircle, Store, ImagePlus, ShieldX, LayoutGrid } from 'lucide-react'
import AdminGate from '@/components/admin/AdminGate'

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
    <div className="min-h-screen bg-gray-50">
      {/* Admin top bar */}
      <div className="bg-[#3a0d22] text-white sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/admin" className="font-bold text-lg">Admin Panel</Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link href="/admin/products/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">Add</span>
              </Link>
              <Link href="/admin/products/bulk" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <ImagePlus className="h-4 w-4" /> <span className="hidden sm:inline">Bulk Upload</span>
              </Link>
              <Link href="/admin/categories" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <LayoutGrid className="h-4 w-4" /> <span className="hidden sm:inline">Categories</span>
              </Link>
              <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <Store className="h-4 w-4" /> <span className="hidden sm:inline">View Store</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  )
}
