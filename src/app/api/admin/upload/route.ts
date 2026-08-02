import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import sharp from 'sharp'

// sharp + heic-convert need the Node.js runtime (not edge)
export const runtime = 'nodejs'
// HEICs that fall back to the slow wasm decoder can take ~10-13s. Raise the
// serverless timeout so those uploads don't fail in production (Vercel default
// is 10s). 60s is the Hobby-plan max and gives ample headroom.
export const maxDuration = 60

const BUCKET = 'product-images'

// Auto-rotate (honour EXIF), resize to <=1500px, compress to JPEG (~150-250 KB).
// `unlimited: true` lifts libheif's strict iref/reference security limits so
// sharp can decode phone HEICs natively (fast) instead of failing to the slow
// wasm fallback. Safe here: uploads are admin-only, not untrusted input.
function encode(input: Buffer) {
  return sharp(input, { unlimited: true })
    .rotate()
    .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 }) // default encoder — much faster than mozjpeg
    .toBuffer()
}

// Target: ~150-250 KB, longest side 1500px, JPEG.
async function processImage(inputBuffer: Buffer, isHeic: boolean): Promise<Buffer> {
  // Fast path: sharp decodes HEIC natively (prebuilt libvips has HEIC read).
  try {
    return await encode(inputBuffer)
  } catch (err) {
    if (!isHeic) throw err
    // Fallback for HEICs sharp can't decode: wasm decoder, then re-encode.
    console.warn('[upload] sharp HEIC decode failed, using heic-convert:', err)
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({
      buffer: inputBuffer as unknown as ArrayBufferLike,
      format: 'JPEG',
      quality: 0.92,
    })
    return encode(Buffer.from(out))
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const name = file.name || ''
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(name)
  const isImage = file.type.startsWith('image/') || isHeic
  if (!isImage) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }
  // Raw phone photos can be large; allow up to 25MB in, we compress it down.
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 25MB' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const inputBuffer = Buffer.from(await file.arrayBuffer())

  const isJpeg = /^image\/jpe?g$/i.test(file.type) || /\.(jpg|jpeg)$/i.test(name)
  const KB = 1024
  const inRange = file.size >= 150 * KB && file.size <= 250 * KB

  let outBuffer: Buffer
  const t0 = Date.now()
  if (isJpeg && inRange) {
    // Already a JPG in the target size range — leave it exactly as-is, no re-encode.
    outBuffer = inputBuffer
    console.log(`[upload] kept ${name} as-is ${(file.size / KB).toFixed(0)}KB`)
  } else {
    // Convert (if HEIC/other) and/or resize+compress into the 150-250KB target.
    try {
      outBuffer = await processImage(inputBuffer, isHeic)
      console.log(
        `[upload] processed ${name} heic=${isHeic} ${(file.size / KB).toFixed(0)}KB -> ${(outBuffer.length / KB).toFixed(0)}KB in ${Date.now() - t0}ms`
      )
    } catch (err) {
      console.error('[upload] image processing failed:', err)
      return NextResponse.json(
        { error: 'Could not process image (unsupported or corrupt file)' },
        { status: 400 }
      )
    }
  }

  // Always stored as optimized JPEG
  const path = `sarees/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const t1 = Date.now()
  const { error } = await admin.storage.from(BUCKET).upload(path, outBuffer, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  console.log(`[upload] supabase put ${path} in ${Date.now() - t1}ms`)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
