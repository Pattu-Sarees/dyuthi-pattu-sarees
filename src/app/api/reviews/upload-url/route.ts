import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'

const BUCKET = 'product-images'

// Issues a signed upload URL for a signed-in customer's review photo. Carries
// NO file — the processed JPEG is uploaded by the browser directly to Supabase.
// Kept strict: signed-in only + rate limited (spam/abuse protection).
export async function POST(req: NextRequest) {
  const rl = rateLimit(`upload:${clientIp(req)}`, 15, 10 * 60_000) // 15 per 10 min
  if (!rl.ok) return tooMany(rl.retryAfter)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to upload photos' }, { status: 401 })

  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Could not create upload URL' }, { status: 500 })

  return NextResponse.json({ path: data.path, token: data.token })
}
