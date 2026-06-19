import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { LayoutDashboard, PlusCircle, Store, ImagePlus } from 'lucide-react'

export const metadata = { title: 'Admin | Dyuthi Pattu Sarees' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')
  if (!isAdminEmail(user.email)) redirect('/')

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
