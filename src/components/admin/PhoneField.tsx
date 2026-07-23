'use client'

import { useMemo, useState } from 'react'
import { usePhoneInput, defaultCountries, parseCountry, FlagImage } from 'react-international-phone'
import 'react-international-phone/style.css'
import { ChevronDown, Search } from 'lucide-react'

export interface PhoneMeta {
  country: string   // iso2, e.g. 'in'
  dialCode: string  // e.g. '91'
}

// Build a country-aware sample placeholder from the format mask, e.g.
// India ".....-....." → "98765-43210" so the user sees the expected digits.
function samplePlaceholder(format: string | { default?: string } | undefined): string {
  const mask = typeof format === 'string' ? format : format?.default || '..........'
  const sample = '9876543210'
  let i = 0
  return mask.replace(/\./g, () => sample[(i++) % sample.length])
}

// International phone input with a searchable country selector.
//  - Default country India (+91)
//  - Dial code is fixed (only changed via the selector, not typeable/removable)
//  - Selector shows flag + country name + dialing code
//  - Mobile responsive
export default function PhoneField({
  value,
  onChange,
}: {
  value: string
  onChange: (fullPhone: string, meta: PhoneMeta) => void
}) {
  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } = usePhoneInput({
    defaultCountry: 'in',
    value,
    // Keep only the national number in the box; the dial code lives in the
    // selector and cannot be deleted by typing.
    disableDialCodeAndPrefix: true,
    onChange: (data) => onChange(data.phone, { country: data.country.iso2, dialCode: data.country.dialCode }),
  })

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const countries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return defaultCountries
      .map(parseCountry)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.dialCode.includes(q.replace('+', '')))
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-stretch h-10 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-[#AD1457] overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 px-2 border-r border-gray-200 hover:bg-gray-50 text-sm text-gray-700 flex-shrink-0"
        >
          <FlagImage iso2={country.iso2} style={{ width: 20, height: 20 }} />
          <span>+{country.dialCode}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handlePhoneValueChange}
          inputMode="numeric"
          placeholder={samplePlaceholder(country.format)}
          className="flex-1 min-w-0 px-3 text-sm focus:outline-none bg-transparent"
        />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[68]" onClick={() => { setOpen(false); setQuery('') }} />
          <div className="absolute z-[70] mt-1 w-72 max-w-[85vw] bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country…"
                  className="w-full h-9 pl-8 pr-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457]"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {countries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No match</p>
              ) : (
                countries.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => { setCountry(c.iso2); setOpen(false); setQuery(''); inputRef.current?.focus() }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-rose-50 ${c.iso2 === country.iso2 ? 'bg-rose-50' : ''}`}
                  >
                    <FlagImage iso2={c.iso2} style={{ width: 20, height: 20 }} className="flex-shrink-0" />
                    <span className="flex-1 truncate text-gray-700">{c.name}</span>
                    <span className="text-gray-400">+{c.dialCode}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
