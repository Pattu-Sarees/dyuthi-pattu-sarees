'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export type ParsedAddress = { line1: string; city: string; state: string; pincode: string }

// A normalized suggestion: a label to show + a resolver that returns the parsed
// address when picked (Google needs a second details call; Photon has it inline).
type Suggestion = { key: string; label: string; resolve: () => Promise<ParsedAddress> }

// ---------- Google Places (used only when a key is configured) ----------
let gPromise: Promise<void> | null = null
function loadGoogle(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as unknown as { google?: { maps?: { places?: unknown } } }
  if (w.google?.maps?.places) return Promise.resolve()
  if (gPromise) return gPromise
  gPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    s.async = true; s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('maps'))
    document.head.appendChild(s)
  })
  return gPromise
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseGoogle(components: any[], fallback: string): ParsedAddress {
  const get = (t: string) => components.find((c) => c.types.includes(t))?.long_name || ''
  const line1 = [get('premise'), get('street_number'), get('route'), get('sublocality') || get('neighborhood')]
    .filter(Boolean).join(', ') || fallback
  return {
    line1,
    city: get('locality') || get('postal_town') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
    pincode: get('postal_code'),
  }
}

// ---------- Photon (free OpenStreetMap fallback, no key) ----------
type PhotonProps = {
  name?: string; housenumber?: string; street?: string; district?: string; suburb?: string
  city?: string; town?: string; village?: string; county?: string; state?: string
  postcode?: string; country?: string; countrycode?: string
}
function parsePhoton(p: PhotonProps, fallback: string): ParsedAddress {
  const line1 = [p.housenumber, p.name, p.street, p.suburb || p.district].filter(Boolean).join(', ')
  return {
    line1: line1 || p.name || fallback,
    city: p.city || p.town || p.village || p.county || '',
    state: p.state || '',
    pincode: p.postcode || '',
  }
}
function photonLabel(p: PhotonProps) {
  return [p.name, p.street, p.suburb || p.district, p.city || p.town || p.village, p.state, p.postcode]
    .filter(Boolean).join(', ')
}

export default function AddressAutocomplete({
  label = 'Address', value, onChange, onSelect, error,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  onSelect: (a: ParsedAddress) => void
  error?: string | null
}) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const skipNext = useRef(false)
  const gSvc = useRef<any>(null)      // AutocompleteService
  const gDetails = useRef<any>(null)  // PlacesService
  const useGoogle = useRef(false)

  // Load Google once if a key is present.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    loadGoogle(key).then(() => {
      const g = (window as any).google
      gSvc.current = new g.maps.places.AutocompleteService()
      gDetails.current = new g.maps.places.PlacesService(document.createElement('div'))
      useGoogle.current = true
    }).catch(() => { useGoogle.current = false })
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
    const q = value.trim()
    if (q.length < 3) { setItems([]); setOpen(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const list = useGoogle.current ? await searchGoogle(q) : await searchPhoton(q)
        setItems(list); setOpen(list.length > 0)
      } catch { setItems([]); setOpen(false) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [value])

  async function searchGoogle(q: string): Promise<Suggestion[]> {
    return new Promise((resolve) => {
      gSvc.current.getPlacePredictions(
        { input: q, componentRestrictions: { country: 'in' } },
        (preds: any[] | null) => {
          resolve((preds || []).map((p) => ({
            key: p.place_id,
            label: p.description,
            resolve: () => new Promise<ParsedAddress>((res) => {
              gDetails.current.getDetails(
                { placeId: p.place_id, fields: ['address_component', 'name'] },
                (place: any) => res(parseGoogle(place?.address_components || [], place?.name || value)),
              )
            }),
          })))
        },
      )
    })
  }

  async function searchPhoton(q: string): Promise<Suggestion[]> {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&lat=22&lon=79`)
    const data = await res.json()
    const feats = (data.features as { properties: PhotonProps }[] || [])
      .filter((f) => f.properties.countrycode === 'IN' || f.properties.country === 'India')
    return feats.map((f, i) => ({
      key: String(i),
      label: photonLabel(f.properties),
      resolve: async () => parsePhoton(f.properties, value),
    }))
  }

  const pick = async (s: Suggestion) => {
    setOpen(false); setItems([])
    const parsed = await s.resolve()
    skipNext.current = true
    onSelect(parsed)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder=" "
          autoComplete="off"
          className={`peer h-12 w-full rounded-md border bg-white px-3 pt-4 pb-1 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-rose-500'
          }`}
        />
        <label className="pointer-events-none absolute left-3 text-gray-400 transition-all top-3.5 text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]">
          {label}
        </label>
        {!value && (
          <span className="pointer-events-none absolute left-3 top-4 text-sm text-gray-300 hidden peer-focus:block">House no, street, area, city</span>
        )}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" /> : <Search className="h-4 w-4 text-gray-400" />}
        </span>
      </div>

      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.map((s) => (
            <li key={s.key}>
              <button type="button" onClick={() => pick(s)} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-rose-50 flex items-start gap-2">
                <Search className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
