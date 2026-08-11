'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, ZoomIn } from 'lucide-react'

// Self-contained image cropper (no external lib) — a plain <img> that the user
// pans (drag) and zooms (slider), cropped to `aspect` on Apply via canvas.
// `aspect` = width / height (e.g. 9/16 for a tall portrait crop).
export default function ImageCropper({
  src,
  aspect = 1,
  shape = 'rect',
  minZoom = 1,
  onCancel,
  onDone,
}: {
  src: string
  aspect?: number
  shape?: 'round' | 'rect'
  minZoom?: number
  onCancel: () => void
  onDone: (blob: Blob) => void | Promise<void>
}) {
  const FRAME_H = 380
  const frameW = Math.round(FRAME_H * aspect)

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [err, setErr] = useState(false)
  const [scale, setScale] = useState(Math.max(1, minZoom))
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Preload the image ourselves so we (a) know its real dimensions before
  // painting, (b) keep a decoded element to crop from, and (c) can show a
  // clear message if the file can't be decoded (e.g. an iPhone HEIC).
  useEffect(() => {
    setNat(null); setErr(false)
    const i = new Image()
    i.onload = () => { imgRef.current = i; setNat({ w: i.naturalWidth, h: i.naturalHeight }) }
    i.onerror = () => setErr(true)
    i.src = src
    return () => { i.onload = null; i.onerror = null }
  }, [src])

  // Cover the frame at scale 1, then multiply by the zoom.
  const baseScale = nat ? Math.max(frameW / nat.w, FRAME_H / nat.h) : 1
  const eff = baseScale * scale
  const imgW = nat ? nat.w * eff : 0
  const imgH = nat ? nat.h * eff : 0
  const maxX = Math.max(0, (imgW - frameW) / 2)
  const maxY = Math.max(0, (imgH - FRAME_H) / 2)
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
  const ox = clamp(offset.x, maxX)
  const oy = clamp(offset.y, maxY)
  const left = frameW / 2 - imgW / 2 + ox
  const top = FRAME_H / 2 - imgH / 2 + oy

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox, oy }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    setOffset({ x: clamp(drag.current.ox + dx, maxX), y: clamp(drag.current.oy + dy, maxY) })
  }
  const onUp = () => { drag.current = null }

  const apply = async () => {
    const image = imgRef.current
    if (!nat || !image) return
    setBusy(true)
    try {
      const sx = -left / eff
      const sy = -top / eff
      const sw = frameW / eff
      const sh = FRAME_H / eff
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sw)
      canvas.height = Math.round(sh)
      const ctx = canvas.getContext('2d')
      if (!ctx) { setBusy(false); return }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), 'image/jpeg', 0.92))
      if (blob) await onDone(blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-bold text-gray-900">Adjust image</h3>
          <p className="text-xs text-gray-500">Drag to reposition · use the slider to zoom</p>
        </div>

        <div className="flex justify-center bg-gray-100 py-4">
          <div
            className={`relative overflow-hidden bg-gray-200 touch-none select-none cursor-move ${shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}
            style={{ width: frameW, height: FRAME_H }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            {err ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-gray-500">
                Couldn&apos;t load this image. Please try a JPG or PNG (HEIC/iPhone photos aren&apos;t supported here).
              </div>
            ) : !nat ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                style={{ position: 'absolute', left, top, width: imgW, height: imgH, maxWidth: 'none' }}
              />
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-gray-400" />
            <input type="range" min={Math.max(1, minZoom)} max={3} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[#C2185B]" />
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={apply} disabled={busy || !nat || err} className="flex-1 h-10 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
