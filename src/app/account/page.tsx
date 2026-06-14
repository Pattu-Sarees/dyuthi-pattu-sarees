'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { User, Mail, Phone, Loader2, LogOut, Package, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function AccountPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?redirect=/account'); return }
      setUser(data.user as { id: string; email: string })
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: profileData }) => {
          if (profileData) setProfile({ full_name: profileData.full_name || '', phone: profileData.phone || '' })
          setLoading(false)
        })
    })
  }, [])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) toast.error('Failed to save profile')
    else toast.success('Profile updated successfully!')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <User className="h-6 w-6 text-rose-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.full_name || 'My Account'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link href="/account" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg">
                <User className="h-4 w-4" /> Profile
              </Link>
              <Link href="/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Package className="h-4 w-4" /> My Orders
              </Link>
              <Link href="/products" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <ShoppingBag className="h-4 w-4" /> Browse Sarees
              </Link>
              <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-gray-400" />Full Name</span>
                </label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-gray-400" />Email Address</span>
                </label>
                <Input value={user?.email || ''} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-400" />Phone Number</span>
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  type="tel"
                />
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
