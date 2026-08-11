import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import sharp from 'sharp'

// sharp + heic-convert need the Node.js runtime (not edge).
export const runtime = 'nodejs'
// HEICs decoded via the wasm fallback can take ~10-13s — give ample headroom.
export const maxDuration = 60

const BUCKET = 'product-images'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

// Auto-rotate (honour EXIF), resize to <=1500px, compress to JPEG.
function encode(input: Buffer) {
  return sharp(input, { unlimited: true })
    .rotate()
    .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
}

async function processImage(inputBuffer: Buffer, isHeic: boolean): Promise<Buffer> {
  try {
    return await encode(inputBuffer)
  } catch (err) {
    if (!isHeic) throw err
    // Fallback for HEICs sharp can't decode natively: wasm decoder, then re-encode.
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({ buffer: inputBuffer as unknown as ArrayBufferLike, format: 'JPEG', quality: 0.92 })
    return encode(Buffer.from(out))
  }
}

// Reads the raw file the browser uploaded directly to storage, converts HEIC +
// compresses it server-side (no request-body size limit here — we DOWNLOAD the
// file, we don't receive it in the request), stores the optimized JPEG, deletes
// the raw temp object, and returns the public URL.
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path, isHeic } = await req.json()
  if (!path || typeof path !== 'string' || !path.startsWith('incoming/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: blob, error: dErr } = await admin.storage.from(BUCKET).download(path)
  if (dErr || !blob) return NextResponse.json({ error: dErr?.message || 'Could not read uploaded file' }, { status: 400 })

  const inputBuffer = Buffer.from(await blob.arrayBuffer())

  let outBuffer: Buffer
  try {
    outBuffer = await processImage(inputBuffer, !!isHeic)
  } catch {
    // Clean up the temp file even on failure.
    await admin.storage.from(BUCKET).remove([path]).catch(() => {})
    return NextResponse.json({ error: 'Could not process image (unsupported or corrupt file)' }, { status: 400 })
  }

  const finalPath = `sarees/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error: uErr } = await admin.storage.from(BUCKET).upload(finalPath, outBuffer, { contentType: 'image/jpeg', upsert: false })
  // Remove the raw temp object regardless of the final upload result.
  await admin.storage.from(BUCKET).remove([path]).catch(() => {})
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  const { data } = admin.storage.from(BUCKET).getPublicUrl(finalPath)
  return NextResponse.json({ url: data.publicUrl })
}
