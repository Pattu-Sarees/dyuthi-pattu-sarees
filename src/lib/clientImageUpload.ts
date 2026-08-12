'use client'

// ============================================================================
// Client-side image pipeline — the ONLY way images reach storage.
//
// Ideal flow (all in the browser, nothing through a Next.js API route):
//   select → detect type → HEIC→JPG (JPG stays JPG) → resize → compress <=4MB
//          → preview → upload the processed JPEG directly to Supabase → save URL
//
// A tiny signed-URL request is made to the server (JSON only, NO file), so the
// image bytes never pass through Vercel's serverless functions.
// ============================================================================

import { createClient } from '@/lib/supabase/client'

const MAX_BYTES = 4 * 1024 * 1024 // <= 4.0MB
const MAX_LONGEST = 3000 // upper bound for the longest side
const MIN_LONGEST = 2400 // lower bound (don't shrink below this unless the source is already smaller)

export const isHeicFile = (f: { type?: string; name?: string }) =>
  /heic|heif/i.test(f.type || '') || /\.(heic|heif)$/i.test(f.name || '')

// Draw a bitmap to a JPEG blob at a given longest-side + quality.
function bitmapToJpeg(bitmap: ImageBitmap, longest: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality))
}

/**
 * Process a selected file into a compressed JPEG (<=4MB, longest side 2400–3000px,
 * EXIF orientation baked in). HEIC is converted to JPEG first; JPEG stays JPEG.
 * Returns a ready-to-upload File. Logs each stage to the console.
 */
export async function processImageForUpload(input: File): Promise<File> {
  const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`
  console.log('[imgupload] original:', input.name, kb(input.size), input.type || '(no type)')

  // 1. Decode to a bitmap (EXIF orientation applied). JPEG/PNG decode directly.
  //    HEIC: NEVER decode in the browser. On Chrome/Windows, createImageBitmap()
  //    on a HEIC often does NOT throw — it "succeeds" but yields a BLANK bitmap,
  //    which we'd then upload as a blank (but valid-looking) JPEG. So for HEIC we
  //    always hand off to the server (heic-convert via /api/admin/process-image),
  //    which decodes it correctly.
  let bitmap: ImageBitmap
  if (isHeicFile(input)) {
    throw new Error('HEIC_NEEDS_SERVER')
  }
  bitmap = await createImageBitmap(input, { imageOrientation: 'from-image' })
  const source: Blob = input
  const longestSide = Math.max(bitmap.width, bitmap.height)

  // 3. Target longest side: aim for ~2600px (inside the 2400–3000 range) — a
  //    smaller file encodes faster and uploads faster. Never upscale a smaller image.
  const targetLongest = Math.min(longestSide, 2600)

  // 4. Compress to <= MAX_BYTES: start at a lean quality (small file → fast
  //    upload) and only step down if still too big; then reduce dimension.
  let best: Blob | null = null
  const tryEncode = async (dim: number, q: number) => {
    const out = await bitmapToJpeg(bitmap, dim, q)
    if (out && (!best || out.size < best.size)) best = out
    return out && out.size <= MAX_BYTES
  }
  let done = false
  for (const q of [0.82, 0.74, 0.66, 0.58]) {
    if (await tryEncode(targetLongest, q)) { done = true; break }
  }
  if (!done && targetLongest > MIN_LONGEST) {
    for (const dim of [Math.max(MIN_LONGEST, Math.round(targetLongest * 0.9)), MIN_LONGEST]) {
      for (const q of [0.8, 0.72, 0.6]) {
        if (await tryEncode(dim, q)) { done = true; break }
      }
      if (done) break
    }
  }
  bitmap.close?.()

  const finalBlob = best ?? source
  console.log('[imgupload] compressed:', kb(finalBlob.size), `(longest≈${targetLongest}px, target≤${kb(MAX_BYTES)})`)

  const name = (input.name.replace(/\.[^.]+$/, '') || 'photo') + '.jpg'
  return new File([finalBlob], name, { type: 'image/jpeg' })
}

/**
 * Upload an already-processed JPEG DIRECTLY to Supabase Storage using a
 * server-issued signed URL (the request that fetches the signed URL carries no
 * file — only the image bytes go to Supabase, never through Vercel).
 */
export async function uploadProcessedImage(
  file: File,
  opts: { signEndpoint?: string; folder?: string; bucket?: string } = {}
): Promise<string> {
  const signEndpoint = opts.signEndpoint || '/api/admin/upload-url'
  const bucket = opts.bucket || 'product-images'
  console.log('[imgupload] upload start:', file.name, `${(file.size / 1024).toFixed(0)}KB → ${bucket}`)

  const r1 = await fetch(signEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: opts.folder }),
  })
  const j1 = await r1.json().catch(() => ({} as { path?: string; token?: string; error?: string }))
  if (!r1.ok || !j1.path || !j1.token) throw new Error(j1.error || 'Could not start upload')

  const supabase = createClient()
  // CRITICAL: storage-js's uploadToSignedUrl IGNORES the contentType option when
  // the body is a Blob/File (it wraps it in FormData and never sets content-type,
  // so the object is stored as the text/plain default → broken images). Passing
  // the RAW BYTES (Uint8Array) instead routes through the code path that DOES
  // apply `content-type`, so the JPEG is stored and served correctly.
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(j1.path, j1.token, bytes, { contentType: file.type || 'image/jpeg', upsert: true })
  if (error) {
    console.error('[imgupload] upload FAILURE:', error.message)
    throw new Error(error.message || 'Upload failed')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(j1.path)
  console.log('[imgupload] upload success:', data.publicUrl)
  return data.publicUrl
}

/**
 * FALLBACK for HEIC the browser can't decode: upload the RAW file directly to
 * Supabase (signed URL), then have the server convert it (heic-convert) and
 * return the final JPEG URL. Only image bytes going to Supabase — the raw file
 * still never passes through a Vercel function as a request body.
 */
export async function uploadRawViaServer(
  file: File,
  opts: { signEndpoint?: string; processEndpoint?: string; folder?: string; bucket?: string } = {}
): Promise<string> {
  const signEndpoint = opts.signEndpoint || '/api/admin/upload-url'
  const processEndpoint = opts.processEndpoint || '/api/admin/process-image'
  const bucket = opts.bucket || 'product-images'
  console.log('[imgupload] upload start (server HEIC fallback):', file.name)

  const r1 = await fetch(signEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: true, folder: opts.folder }),
  })
  const j1 = await r1.json().catch(() => ({} as { path?: string; token?: string; error?: string }))
  if (!r1.ok || !j1.path || !j1.token) throw new Error(j1.error || 'Could not start upload')

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(j1.path, j1.token, file, { contentType: file.type || 'application/octet-stream', upsert: true })
  if (error) { console.error('[imgupload] raw upload FAILURE:', error.message); throw new Error(error.message || 'Upload failed') }

  const r2 = await fetch(processEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: j1.path, isHeic: true, folder: opts.folder }),
  })
  const j2 = await r2.json().catch(() => ({} as { url?: string; error?: string }))
  if (!j2.url) throw new Error(j2.error || 'Could not process image')
  console.log('[imgupload] server conversion success:', j2.url)
  return j2.url as string
}

/**
 * Process (convert/resize/compress) then upload — returns the public URL.
 * If a HEIC can't be decoded in the browser, falls back to server conversion.
 */
export async function processAndUpload(
  input: File,
  opts: { signEndpoint?: string; folder?: string; bucket?: string } = {}
): Promise<string> {
  try {
    const processed = await processImageForUpload(input)
    return await uploadProcessedImage(processed, opts)
  } catch (e) {
    if (isHeicFile(input) && (e as Error)?.message === 'HEIC_NEEDS_SERVER') {
      return uploadRawViaServer(input, opts)
    }
    throw e
  }
}
