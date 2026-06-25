'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Loader2, ZoomIn } from 'lucide-react'

async function getCroppedBlob(src: string, area: Area): Promise<Blob | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // White background so zoomed-out (padded) areas are clean, not transparent/black
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // Draw the full image offset so the crop area maps to the canvas — handles zoom-out
  ctx.drawImage(image, -area.x, -area.y, image.naturalWidth, image.naturalHeight)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92))
}

export default function ImageCropper({
  src,
  aspect = 1,
  shape = 'round',
  onCancel,
  onDone,
}: {
  src: string
  aspect?: number
  shape?: 'round' | 'rect'
  onCancel: () => void
  onDone: (blob: Blob) => void | Promise<void>
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), [])

  const apply = async () => {
    if (!area) return
    setBusy(true)
    const blob = await getCroppedBlob(src, area)
    if (blob) await onDone(blob)
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-bold text-gray-900">Adjust image</h3>
          <p className="text-xs text-gray-500">Drag to reposition · pinch or use the slider to zoom</p>
        </div>
        <div className="relative h-80 bg-gray-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            showGrid={false}
            minZoom={0.4}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-gray-400" />
            <input type="range" min={0.4} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C2185B]" />
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={apply} disabled={busy} className="flex-1 h-10 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
