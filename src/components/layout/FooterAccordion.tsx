'use client'

import { useState } from 'react'

export default function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4"
        aria-expanded={open}
      >
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <span className="text-white text-2xl leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}
