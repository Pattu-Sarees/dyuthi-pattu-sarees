'use client'

import { useEffect, useRef } from 'react'

export type ParsedAddress = {
  line1: string
  city: string
  state: string
  pincode: string
}

// Loads the Google Maps Places script once and shares the promise.
let placesPromise: Promise<void> | null = null
function loadPlaces(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as unknown as { google?: { maps?: { places?: unknown } } }
  if (w.google?.maps?.places) return Promise.resolve()
  if (placesPromise) return placesPromise
  placesPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(s)
  })
  return placesPromise
}

/**
 * Attaches Google Places autocomplete (India) to an address input. When the
 * user picks a suggestion, the parsed street/city/state/pincode are passed to
 * `onSelect`. If no API key is set, it does nothing (the field still works as a
 * plain text input). Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export function useAddressAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onSelect: (addr: ParsedAddress) => void,
) {
  const cb = useRef(onSelect)
  cb.current = onSelect

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || !inputRef.current) return
    let ac: { addListener: (e: string, f: () => void) => void; getPlace: () => GooglePlace } | null = null

    loadPlaces(key)
      .then(() => {
        if (!inputRef.current) return
        const g = (window as unknown as { google: GoogleMaps }).google
        ac = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'name'],
          types: ['geocode'],
        })
        ac.addListener('place_changed', () => {
          if (!ac) return
          cb.current(parsePlace(ac.getPlace()))
        })
      })
      .catch(() => {
        /* no key / offline — field still works as plain input */
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ---- Google Maps minimal types ----
type GoogleComponent = { long_name: string; short_name: string; types: string[] }
type GooglePlace = { address_components?: GoogleComponent[]; name?: string }
type GoogleMaps = {
  maps: { places: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => {
    addListener: (e: string, f: () => void) => void
    getPlace: () => GooglePlace
  } } }
}

function parsePlace(place: GooglePlace): ParsedAddress {
  const comps = place.address_components || []
  const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name || ''
  const streetNumber = get('street_number')
  const route = get('route')
  const premise = get('premise') || get('subpremise')
  const sublocality = get('sublocality') || get('sublocality_level_1') || get('neighborhood')
  const line1 = [premise, streetNumber, route, sublocality].filter(Boolean).join(', ') || place.name || ''
  const city = get('locality') || get('postal_town') || get('administrative_area_level_2')
  const state = get('administrative_area_level_1')
  const pincode = get('postal_code')
  return { line1, city, state, pincode }
}
