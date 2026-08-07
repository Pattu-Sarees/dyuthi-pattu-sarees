import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'

const BUCKET = 'product-images'
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Review-photo upload for signed-in customers. Strict: signed-in only, images
// only (MIME + extension), ≤5MB, stored under reviews/ in the public bucket.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`upload:${clientIp(req)}`, 15, 10 * 60_000) // 15 per 10 min
  if (!rl.ok) return tooMany(rl.retryAfter)

  // Require a logged-in user (prevents anonymous storage abuse / spam).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to upload photos' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const extCheck = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED.includes(file.type) || !ALLOWED_EXT.includes(extCheck)) {
    return NextResponse.json({ error: 'Use a JPG, PNG or WEBP image' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (error) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
