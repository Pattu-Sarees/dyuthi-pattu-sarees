import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

// heic-convert needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'product-images'
const ALLOWED_FOLDERS = new Set(['sarees', 'categories', 'homepage', 'branding', 'reviews', 'misc'])

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

async function processImage(inputBuffer: Buffer, isHeic: boolean): Promise<Buffer> {
  // Step 1 — HEIC → JPEG via heic-convert (libheif wasm), verified to decode
  // these phone HEICs correctly. (JPEG/PNG input is passed straight through.)
  let jpegBuffer = inputBuffer
  if (isHeic) {
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({ buffer: inputBuffer as unknown as ArrayBufferLike, format: 'JPEG', quality: 0.85 })
    jpegBuffer = Buffer.from(out)
    console.log(`[process-image] heic-convert ${(inputBuffer.length / 1024).toFixed(0)}KB HEIC -> ${(jpegBuffer.length / 1024).toFixed(0)}KB JPEG`)
  }

  // Step 2 — resize + compress with jimp (pure-JS, no native binary). We use
  // jimp instead of sharp because sharp's resize was CORRUPTING these large
  // (24MP) images on Vercel, producing broken files. jimp is slower but reliable.
  const Jimp = (await import('jimp')).default
  const image = await Jimp.read(jpegBuffer)
  if (Math.max(image.bitmap.width, image.bitmap.height) > 1600) {
    image.scaleToFit(1600, 1600) // downscale only; preserves aspect ratio
  }
  image.quality(80)
  const outBuf = await image.getBufferAsync(Jimp.MIME_JPEG)
  console.log(`[process-image] jimp ${image.bitmap.width}x${image.bitmap.height} -> ${(outBuf.length / 1024).toFixed(0)}KB`)
  return outBuf
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
