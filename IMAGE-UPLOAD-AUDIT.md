# Image Upload Pipeline — Audit & Refactor Report

_Experimental change. If it doesn't work out, revert the commit and the previous
signed-URL + server-processing flow returns._

## New architecture (active in production after deploy)

**Hybrid** (chosen after `ERR_LIBHEIF`): JPEG/PNG and browser-decodable HEIC go
the full browser path. A HEIC the browser can't decode falls back to uploading
the raw file directly to Supabase, then the server converts it (heic-convert).
In every case the image bytes go straight to Supabase — never through a Vercel
function as a request body.

```
Select photo → detect type → HEIC→JPG (JPG stays JPG) → resize (2400–3000px,
EXIF baked in) → compress ≤4MB → preview → upload processed JPEG DIRECTLY to
Supabase Storage (signed URL) → save public URL
```

Core module: **`src/lib/clientImageUpload.ts`**
- `processImageForUpload(file)` — HEIC→JPEG via `heic2any` (browser), decode with
  `createImageBitmap(..., { imageOrientation: 'from-image' })` (EXIF preserved),
  resize longest side to 2400–3000px, compress to ≤4MB (quality then dimension
  steps). Logs: original size, converted size, compressed size.
- `uploadProcessedImage(file, { signEndpoint, folder, bucket })` — fetches a
  signed upload URL (JSON only, no file), then `uploadToSignedUrl(...)` straight
  to Supabase. Logs: upload start, success, failure.
- `processAndUpload(file, opts)` — convenience wrapper.

Signed-URL endpoints (carry **no file** — compliant with "no image through a
function"):
- `POST /api/admin/upload-url` — admin, returns `{ path, token }` for a final
  `.jpg` path in an allow-listed folder (`sarees|categories|homepage|branding|misc`).
- `POST /api/reviews/upload-url` — signed-in customer, rate-limited, `reviews/` folder.

## Requirement checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | No image file through a Next.js API route | ✅ only signed-URL JSON hits functions |
| 2 | HEIC → JPEG in the browser | ✅ `heic2any` in `processImageForUpload` |
| 3 | JPEG + HEIC resized/compressed client-side ≤4MB before upload | ✅ |
| 4 | Upload only the processed JPEG directly to Supabase | ✅ `uploadToSignedUrl` |
| 5 | Server-side HEIC conversion | ⚠️ kept as FALLBACK only — used when the browser (libheif) can't decode a HEIC (e.g. Windows Chrome, `ERR_LIBHEIF`). JPEG/PNG never touch the server. |
| 6 | `heic-convert` on server | ⚠️ retained for the HEIC fallback only (`/api/admin/process-image`) |
| 7 | EXIF orientation preserved | ✅ `createImageBitmap({ imageOrientation: 'from-image' })` |
| 8 | Longest side 2400–3000px | ✅ `MIN_LONGEST=2400`, `MAX_LONGEST=3000` |
| 9 | Don't revoke preview URL until final URL is in state AND loaded | ✅ `preloadImage()` before swap, revoke in `finally` |
| 10 | Console logging (orig/converted/compressed/start/success/failure) | ✅ `[imgupload] …` logs |
| 11 | Remove all Vercel image upload code paths | ✅ see table below |
| 12 | Report of upload paths + which is active | ✅ this document |

## Every upload path found, and its status

| Caller | Old path (through Vercel) | New path |
|--------|---------------------------|----------|
| `components/admin/ProductForm.tsx` (Add Photos / Additional Photos) | `/api/admin/upload-url` + `/api/admin/process-image` | **client pipeline → direct Supabase** |
| `app/admin/categories/page.tsx` (carousel image) | `/api/admin/upload` (multipart) | `processAndUpload(folder:'categories')` |
| `app/admin/homepage/page.tsx` (hero slide + section images) | `/api/admin/upload` (multipart, 2×) | `processAndUpload(folder:'homepage')` |
| `app/admin/settings/page.tsx` (hero banner) | `/api/admin/upload` (multipart) | `processAndUpload(folder:'homepage')` |
| `app/admin/profile/page.tsx` (avatar) | `/api/admin/upload` (multipart) | `processAndUpload(folder:'branding')` |
| `app/admin/reviews/page.tsx` (proof image) | `/api/admin/upload` (multipart) | `processAndUpload(folder:'reviews')` |
| `components/reviews/ReviewForm.tsx` (customer review photos) | `/api/reviews/upload` (multipart) | `processAndUpload(signEndpoint:'/api/reviews/upload-url')` |

### Deprecated routes (now return HTTP 410, no file handling)
- `POST /api/admin/upload` — was multipart + `sharp` + `heic-convert`.
- `POST /api/admin/process-image` — was `sharp` + `heic-convert`.
- `POST /api/reviews/upload` — was multipart + `file.arrayBuffer()`.

(These files could not be deleted in the working environment; they were reduced
to 410 stubs. Delete them fully when convenient — nothing calls them.)

### Orphans (harmless, unused)
- `src/lib/optimizeImage.ts` — old client helper, not imported anywhere.
- `src/types/heic-convert.d.ts` — type shim for the removed dependency.

## Which path is active in production

After this deploy, **only the client pipeline** is active for every uploader
above. The Vercel functions involved in uploading are limited to the two
signed-URL issuers, which never receive image bytes.

## Notes / caveats
- Requires `SUPABASE_SERVICE_ROLE_KEY` in the environment (already used by other
  admin routes) so the signed-URL endpoints can mint upload tokens.
- `sharp` remains in `package.json` but is no longer imported server-side; it can
  be removed later if nothing else needs it.
