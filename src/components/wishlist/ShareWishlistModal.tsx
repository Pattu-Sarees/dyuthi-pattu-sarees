'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, Mail, Send, Loader2, MessageSquare, Share2 } from 'lucide-react'
import { toast } from 'sonner'

// WhatsApp glyph (used for both WhatsApp and WhatsApp Business).
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345c-.091.378-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.608 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0" />
    </svg>
  )
}

const TEMPLATE = (link: string) =>
  `Hi,\n\nI shortlisted these sarees from Dyuthi Pattu Sarees.\n\nView my wishlist:\n${link}\n\nPlease help me choose \u{1F60A}`

export default function ShareWishlistModal({
  items,
  ownerName,
  userId,
  onClose,
}: {
  items: string[]
  ownerName: string
  userId?: string | null
  onClose: () => void
}) {
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [showIcons, setShowIcons] = useState(false)

  useEffect(() => {
    setIsMobile(typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent))
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/wishlist/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, ownerName, userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.code) setLink(`${window.location.origin}/wishlist/share/${data.code}`)
        else setError(data.error || 'Could not create link')
      })
      .catch(() => !cancelled && setError('Could not create link'))
    return () => {
      cancelled = true
    }
  }, [items, ownerName, userId])

  const message = link ? TEMPLATE(link) : ''
  const encMsg = encodeURIComponent(message)
  const encLink = encodeURIComponent(link || '')

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success('Wishlist message copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  // On phones, prefer the OS share sheet — it surfaces every installed app
  // (WhatsApp Business, Instagram, SMS, …) natively.
  // Primary "Share" button on phones. Uses the OS share sheet when available
  // (HTTPS/localhost); otherwise falls back to revealing the icon grid.
  const primaryShare = async () => {
    if (!link) return
    if (canNativeShare) {
      try {
        await navigator.share({ title: 'My Dyuthi Pattu Sarees Wishlist', text: message })
      } catch {
        /* user dismissed the share sheet — no-op */
      }
    } else {
      setShowIcons(true)
    }
  }

  // Instagram has no web share URL for arbitrary links, so copy the message and
  // open Instagram for the user to paste into a DM/story.
  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Message copied — paste it in Instagram')
    } catch {}
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  }

  const targets: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void; bg: string; show: boolean }[] = [
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="h-6 w-6" />,
      href: `https://wa.me/?text=${encMsg}`,
      bg: 'bg-[#25D366]',
      show: true,
    },
    {
      label: 'WhatsApp Business',
      icon: <WhatsAppIcon className="h-6 w-6" />,
      href: `https://api.whatsapp.com/send?text=${encMsg}`,
      bg: 'bg-[#128C7E]',
      show: true,
    },
    {
      label: 'Facebook',
      icon: <FacebookIcon className="h-6 w-6" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encLink}`,
      bg: 'bg-[#1877F2]',
      show: true,
    },
    {
      label: 'Telegram',
      icon: <Send className="h-6 w-6" />,
      href: `https://t.me/share/url?url=${encLink}&text=${encodeURIComponent(TEMPLATE('').trim())}`,
      bg: 'bg-[#0088cc]',
      show: true,
    },
    {
      label: 'Email',
      icon: <Mail className="h-6 w-6" />,
      href: `mailto:?subject=${encodeURIComponent('My Dyuthi Pattu Sarees Wishlist')}&body=${encMsg}`,
      bg: 'bg-[#AD1457]',
      show: true,
    },
    {
      label: 'Instagram',
      icon: <InstagramIcon className="h-6 w-6" />,
      onClick: shareToInstagram,
      bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
      show: true,
    },
    {
      label: 'Twitter',
      icon: <TwitterIcon className="h-5 w-5" />,
      href: `https://twitter.com/intent/tweet?text=${encMsg}`,
      bg: 'bg-black',
      show: true,
    },
    {
      label: 'Pinterest',
      icon: <PinterestIcon className="h-6 w-6" />,
      href: `https://www.pinterest.com/pin/create/button/?url=${encLink}&description=${encodeURIComponent(TEMPLATE('').trim())}`,
      bg: 'bg-[#E60023]',
      show: true,
    },
    {
      label: 'Message',
      icon: <MessageSquare className="h-6 w-6" />,
      href: `sms:?&body=${encMsg}`,
      bg: 'bg-[#5BC236]',
      show: isMobile,
    },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-label="Share wishlist">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#4E1E24] text-lg">Share Wishlist</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5 text-[#4E1E24]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <p className="text-sm text-red-600 py-8 text-center">{error}</p>
          ) : !link ? (
            <div className="flex flex-col items-center gap-2 py-10 text-[#4E1E24]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Generating your share link…</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">Send your shortlisted sarees to family &amp; friends:</p>

              {/* Mobile: prominent Share button → OS share sheet (all installed apps),
                  or reveals the icon grid when the native sheet isn't available. */}
              {isMobile && (
                <button
                  onClick={primaryShare}
                  className="w-full flex items-center justify-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold py-3 rounded-lg transition-colors mb-4"
                >
                  <Share2 className="h-5 w-5" /> Share
                </button>
              )}

              {/* Icons — always on desktop; on mobile only after tapping Share (fallback) */}
              {(!isMobile || showIcons) && (
              <div className="grid grid-cols-4 gap-3 mb-5">
                {targets
                  .filter((t) => t.show)
                  .map((t) => {
                    const inner = (
                      <>
                        <span className={`h-12 w-12 rounded-full ${t.bg} text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform`}>
                          {t.icon}
                        </span>
                        <span className="text-[11px] leading-tight text-gray-600">{t.label}</span>
                      </>
                    )
                    return t.onClick ? (
                      <button key={t.label} onClick={t.onClick} type="button" className="flex flex-col items-center gap-1.5 text-center">
                        {inner}
                      </button>
                    ) : (
                      <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 text-center">
                        {inner}
                      </a>
                    )
                  })}
              </div>
              )}

              {/* Copyable link row */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                <span className="flex-1 text-xs text-gray-600 truncate">{link}</span>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 text-xs font-semibold text-[#AD1457] hover:text-[#880E4F] flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
