import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

const BUCKET = 'product-images'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

// Issues a short-lived signed upload URL so the browser can upload the raw file
// DIRECTLY to Supabase Storage — bypassing Vercel's 4.5MB serverless request-body
// limit (which is what makes large phone photos fail on the live site). The
// signed token is server-issued, so this doesn't require write RLS on the bucket.
export async function POST() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  // Raw upload lands in an "incoming/" temp area; process-image converts it and
  // writes the final optimized JPEG, then deletes this temp object.
  const path = `incoming/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Could not create upload URL' }, { status: 500 })

  return NextResponse.json({ path: data.path, token: data.token })
}
