import { NextResponse } from 'next/server'

// DEPRECATED — review photos are now processed in the browser and uploaded
// directly to Supabase Storage via a signed URL (see /api/reviews/upload-url).
// No image file passes through this function anymore.
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated: review photos upload directly to storage.' },
    { status: 410 }
  )
}
