import imageCompression from 'browser-image-compression'

// Converts HEIC/HEIF -> JPG and compresses images to ~150-250 KB (max 1500px)
// before upload. Runs in the browser so what reaches the server is web-ready.
// Designed to NEVER block an upload: if anything fails it falls back to the
// original (or HEIC-converted) file and logs the real reason to the console.
export async function optimizeImage(file: File): Promise<File> {
  let workingFile = file

  // 1) Convert iPhone HEIC/HEIF to JPG (only if needed)
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
  if (isHeic) {
    try {
      const mod = await import('heic2any')
      const heic2any = (mod.default || mod) as (opts: {
        blob: Blob
        toType?: string
        quality?: number
      }) => Promise<Blob | Blob[]>

      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
      const blob = Array.isArray(converted) ? converted[0] : converted
      workingFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
      })
    } catch (err) {
      // HEIC couldn't be converted in this browser — surface it, since the raw
      // HEIC likely won't display on the storefront.
      console.error('[optimizeImage] HEIC conversion failed:', err)
      throw new Error('HEIC not supported in this browser')
    }
  }

  // 2) Resize + compress. If this fails, fall back to the working file so the
  // upload still succeeds (server allows up to 8MB).
  try {
    const compressed = await imageCompression(workingFile, {
      maxSizeMB: 0.25, // ~250 KB ceiling
      maxWidthOrHeight: 1500,
      initialQuality: 0.82,
      useWebWorker: false, // avoids bundler/worker issues in Next
      fileType: 'image/jpeg',
    })
    const finalName = compressed.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([compressed], finalName, { type: 'image/jpeg' })
  } catch (err) {
    console.error('[optimizeImage] compression failed, uploading original:', err)
    return workingFile
  }
}
