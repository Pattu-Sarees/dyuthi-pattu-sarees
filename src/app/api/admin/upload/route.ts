import { NextResponse } from 'next/server'

// DEPRECATED — admin image uploads no longer pass files through this function.
// Images are converted (HEIC→JPEG), resized and compressed in the browser and
// uploaded directly to Supabase Storage via a signed URL (/api/admin/upload-url).
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated: images upload directly to storage via /api/admin/upload-url.' },
    { status: 410 }
  )
}
