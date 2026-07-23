import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'product-images'
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Public upload for customer review photos. Kept intentionally strict:
// images only, ≤5MB, stored under reviews/ in the public bucket.
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED.includes(file.type)) {
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
