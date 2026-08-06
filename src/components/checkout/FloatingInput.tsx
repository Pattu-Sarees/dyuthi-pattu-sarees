'use client'

import { forwardRef } from 'react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  maxLength?: number
  autoComplete?: string
  name?: string
  right?: React.ReactNode // optional adornment (e.g. search icon)
  prefix?: string // fixed prefix shown inside the field (e.g. "+91")
  placeholderHint?: string // faint hint shown when empty (e.g. "######")
  staticLabel?: boolean // keep label pinned small at top + show hint immediately (no focus needed)
}

// Input whose label floats above and STAYS visible once the field has a value
// (so a filled field still shows "First name", "PIN code", etc. — not blank).
const FloatingInput = forwardRef<HTMLInputElement, Props>(function FloatingInput(
  { label, value, onChange, error, type = 'text', inputMode, maxLength, autoComplete, name, right, prefix, placeholderHint, staticLabel },
  ref,
) {
  const leftPad = prefix ? 'pl-14' : 'px-3'
  const labelLeft = prefix ? 'left-14' : 'left-3'
  return (
    <div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-0 top-0 h-12 w-12 flex items-center justify-center border-r border-gray-300 text-sm text-gray-600 select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          name={name}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className={`peer h-12 w-full rounded-md border bg-white ${leftPad} pt-4 pb-1 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-rose-500'
          } ${right ? 'pr-9' : ''}`}
        />
        <label
          className={staticLabel
            ? `pointer-events-none absolute ${labelLeft} top-1.5 text-[10px] text-gray-400`
            : `pointer-events-none absolute ${labelLeft} text-gray-400 transition-all
               top-3.5 text-sm
               peer-focus:top-1.5 peer-focus:text-[10px]
               peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]`}
        >
          {label}
        </label>
        {placeholderHint && !value && (
          // staticLabel: label is pinned at top, so show the hint immediately.
          // otherwise: show only on focus so it doesn't overlap the resting label.
          <span className={`pointer-events-none absolute ${labelLeft} top-4 text-sm text-gray-300 ${staticLabel ? '' : 'hidden peer-focus:block'}`}>{placeholderHint}</span>
        )}
        {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export default FloatingInput
