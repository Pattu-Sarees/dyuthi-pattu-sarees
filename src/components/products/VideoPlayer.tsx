'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Maximize, PlayCircle, X } from 'lucide-react'

// Minimal video player for silent product videos: play/pause + progress + fullscreen.
// No volume (videos have no audio) and no download/right-save (custom controls only).
export default function VideoPlayer({ src, title, label, watermark }: { src: string; title?: string; label?: string; watermark?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  // Real width/height ratio of the file, so the player reserves the exact shape
  // (any orientation) — no letterbox/pillarbox, no default-size flash on load.
  const [ratio, setRatio] = useState<number | undefined>(undefined)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Track fullscreen so we can show an explicit close (X) button (mobile-friendly exit).
  // On exit, scroll the video back into view so the user lands where they left off.
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      if (!fs) {
        setTimeout(() => wrapRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' }), 0)
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const exitFullscreen = () => { if (document.fullscreenElement) document.exitFullscreen?.() }

  const onMeta = () => {
    const v = videoRef.current
    if (v && v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight)
  }

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  const start = () => {
    const v = videoRef.current
    if (v) { v.play(); setPlaying(true) }
  }

  const onTime = () => {
    const v = videoRef.current
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100)
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (v && v.duration) v.currentTime = (Number(e.target.value) / 100) * v.duration
  }

  const fullscreen = () => wrapRef.current?.requestFullscreen?.()

  return (
    <div className="w-fit max-w-full">
      {label && (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#4E1E24] mb-2 hover:text-[#C2185B] transition-colors"
        >
          <PlayCircle className="h-4 w-4 text-[#C2185B]" /> {label}
        </button>
      )}
    <div ref={wrapRef} className="productVideoWrap relative w-fit max-w-full rounded-xl overflow-hidden bg-black group/vid">
      {/* Close (X) — only in fullscreen, easy exit on mobile */}
      {isFullscreen && (
        <button
          type="button"
          onClick={exitFullscreen}
          aria-label="Exit fullscreen"
          className="absolute top-4 right-4 z-20 h-11 w-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-800 hover:text-[#C2185B] transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      )}
      <video
        ref={videoRef}
        src={src}
        title={title}
        playsInline
        muted
        preload="metadata"
        onClick={toggle}
        onLoadedMetadata={onMeta}
        onTimeUpdate={onTime}
        onEnded={() => setPlaying(false)}
        onContextMenu={(e) => e.preventDefault()}
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
        className="block max-h-[80vh] w-auto max-w-full cursor-pointer"
      />

      {/* Watermark overlay — centered, large; promotes the brand and rides along on screen-recordings */}
      {watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="text-white/50 text-xl md:text-3xl font-semibold tracking-wide whitespace-nowrap px-2"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.75)' }}
          >
            {watermark}
          </span>
        </div>
      )}

      {/* Invisible click layer — tap the video to play/pause (no big button) */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute inset-0"
      />

      {/* Bottom control bar — always visible on touch/mobile, hover-reveal on desktop */}
      <div className="absolute bottom-0 inset-x-0 z-10 flex items-center gap-3 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover/vid:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="text-white flex-shrink-0">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={seek}
          aria-label="Seek"
          className="flex-1 h-1 accent-[#C2185B] cursor-pointer"
        />
        <button type="button" onClick={fullscreen} aria-label="Fullscreen" className="text-white flex-shrink-0">
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
    </div>
  )
}
