import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

const BUCKET = 'product-images'
// Folders the admin pipeline is allowed to write to.
const ALLOWED_FOLDERS = new Set(['sarees', 'categories', 'homepage', 'branding', 'misc'])

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

// Issues a short-lived signed upload URL so the browser can upload the ALREADY
// PROCESSED JPEG directly to Supabase Storage — the image bytes never pass
// through this function (only this tiny JSON response does). This is what keeps
// large photos off Vercel's 4.5MB request-body limit.
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let folder = 'sarees'
  let raw = false
  try {
    const body = await req.json().catch(() => ({}))
    if (typeof body?.folder === 'string' && ALLOWED_FOLDERS.has(body.folder)) folder = body.folder
    raw = body?.raw === true
  } catch { /* defaults */ }

  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  // raw=true → temp "incoming/" object for the server HEIC fallback (process-image
  // converts it). Otherwise a final ".jpg" path the browser uploads directly to.
  const rand = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = raw ? `incoming/${rand}` : `${folder}/${rand}.jpg`
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Could not create upload URL' }, { status: 500 })

  return NextResponse.json({ path: data.path, token: data.token })
}
