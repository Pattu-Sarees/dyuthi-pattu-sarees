import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import sharp from 'sharp'

// sharp + heic-convert need the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'product-images'
const ALLOWED_FOLDERS = new Set(['sarees', 'categories', 'homepage', 'branding', 'reviews', 'misc'])

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

// Auto-rotate (honour EXIF), resize to <=3000px, compress to JPEG.
function encode(input: Buffer) {
  return sharp(input, { unlimited: true })
    .rotate()
    .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
}

async function processImage(inputBuffer: Buffer, isHeic: boolean): Promise<Buffer> {
  // HEIC: decode with heic-convert FIRST — do NOT let sharp attempt the HEIC
  // decode. On some platforms sharp's libheif "succeeds" on phone HEICs but
  // returns a BLANK/garbled image; heic-convert (libheif wasm) decodes them
  // correctly. sharp is then only used to resize/compress the decoded JPEG.
  if (isHeic) {
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({ buffer: inputBuffer as unknown as ArrayBufferLike, format: 'JPEG', quality: 0.92 })
    const jpeg = Buffer.from(out)
    console.log(`[process-image] heic-convert decoded ${(inputBuffer.length / 1024).toFixed(0)}KB HEIC -> ${(jpeg.length / 1024).toFixed(0)}KB JPEG`)
    return encode(jpeg)
  }
  return encode(inputBuffer)
}

// SERVER FALLBACK — only used for HEIC files the browser couldn't decode. The
// browser uploaded the RAW file directly to storage; here we download it (no
// request-body size limit on a download), convert + compress, store the final
// JPEG, delete the raw temp object, and return the public URL.
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path, isHeic, folder } = await req.json()
  if (!path || typeof path !== 'string' || !path.startsWith('incoming/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  const dest = ALLOWED_FOLDERS.has(folder) ? folder : 'sarees'

  const admin = createAdminClient()
  const { data: blob, error: dErr } = await admin.storage.from(BUCKET).download(path)
  if (dErr || !blob) return NextResponse.json({ error: dErr?.message || 'Could not read uploaded file' }, { status: 400 })

  const inputBuffer = Buffer.from(await blob.arrayBuffer())

  let outBuffer: Buffer
  try {
    outBuffer = await processImage(inputBuffer, !!isHeic)
  } catch {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {})
    return NextResponse.json({ error: 'Could not process image (unsupported or corrupt file)' }, { status: 400 })
  }

  const finalPath = `${dest}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error: uErr } = await admin.storage.from(BUCKET).upload(finalPath, outBuffer, { contentType: 'image/jpeg', upsert: false })
  await admin.storage.from(BUCKET).remove([path]).catch(() => {})
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  const { data } = admin.storage.from(BUCKET).getPublicUrl(finalPath)
  return NextResponse.json({ url: data.publicUrl })
}
