'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { processAndUpload } from '@/lib/clientImageUpload'
import { Loader2, Pencil, Mail, Phone, Shield, Clock, Calendar, CheckCircle2, ImagePlus, X, User as UserIcon, Save } from 'lucide-react'

const input = 'w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="h-8 w-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  )
}

export default function AdminProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [avatar, setAvatar] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const hydrate = (u: User | null) => {
    setUser(u)
    setFullName(u?.user_metadata?.full_name || '')
    setMobile(u?.user_metadata?.mobile || '')
    setAvatar(u?.user_metadata?.avatar_url || '')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { hydrate(data.user); setLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      setAvatar(await processAndUpload(file, { folder: 'branding' }))
    } catch (e) {
      toast.error((e as Error)?.message || 'Upload failed')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    if (fullName && !/^[A-Za-z ]+$/.test(fullName.trim())) return toast.error('Name can contain only alphabets')
    if (mobile && !/^[0-9+\-\s()]{7,20}$/.test(mobile.trim())) return toast.error('Enter a valid mobile number')
    setSaving(true)
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim(), mobile: mobile.trim(), avatar_url: avatar } })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    hydrate(data.user)
    setEditing(false)
    toast.success('Profile updated')
  }

  const cancel = () => { hydrate(user); setEditing(false) }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#AD1457]" /></div>

  const displayName = user?.user_metadata?.full_name || 'Admin'
  const initial = (displayName || user?.email || 'A').trim()[0]?.toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-5" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>My Profile</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
          {editing ? (
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-[#4E1E24] flex items-center justify-center text-[#F4E5C2] text-xl font-semibold">
                {avatar ? <Image src={avatar} alt="" fill className="object-cover" sizes="64px" /> : initial}
              </div>
              <div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#AD1457] border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-[#AD1457]">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} {avatar ? 'Change' : 'Upload'}
                </button>
                {avatar && <button onClick={() => setAvatar('')} className="ml-1.5 text-xs text-gray-400 hover:text-red-600"><X className="h-3.5 w-3.5 inline" /></button>}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0] || null)} />
              </div>
            </div>
          ) : (
            <>
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-[#4E1E24] flex items-center justify-center text-[#F4E5C2] text-xl font-semibold flex-shrink-0">
                {avatarUrl ? <Image src={avatarUrl} alt="" fill className="object-cover" sizes="64px" /> : initial}
              </div>
              <div>
                <p className="text-lg font-bold text-[#4E1E24]">{displayName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </>
          )}
        </div>

        {/* Fields */}
        {editing ? (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value.replace(/[^A-Za-z ]/g, ''))} className={input} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9+\-\s()]/g, ''))} className={input} placeholder="+91 98765 43210" />
            </div>
            <p className="text-[11px] text-gray-400">Email, role and account status can’t be changed here.</p>
            <div className="flex gap-3 pt-1">
              <button onClick={cancel} className="px-4 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm h-10 rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50 pt-2">
              <InfoRow icon={UserIcon} label="Full Name" value={displayName} />
              <InfoRow icon={Mail} label="Email Address" value={user?.email || '—'} />
              <InfoRow icon={Phone} label="Mobile Number" value={user?.user_metadata?.mobile || '—'} />
              <InfoRow icon={Shield} label="Role" value="Super Admin" />
              <InfoRow icon={CheckCircle2} label="Account Status" value={user?.email_confirmed_at ? 'Active' : 'Pending'} />
              <InfoRow icon={Clock} label="Last Login" value={fmt(user?.last_sign_in_at)} />
              <InfoRow icon={Calendar} label="Created Date" value={fmt(user?.created_at)} />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold text-sm px-4 h-10 rounded-lg">
                <Pencil className="h-4 w-4" /> Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
