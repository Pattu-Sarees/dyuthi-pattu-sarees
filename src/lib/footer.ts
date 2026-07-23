// Editable footer content, stored in the `footer` homepage_sections row's `data`
// JSON. These defaults mirror the original hardcoded footer, so the storefront
// looks identical until an admin overrides a field.

export type FooterData = {
  description: string
  tagline: string
  email: string
  phone: string
  address: string
  facebook: string
  instagram: string
  youtube: string
}

export const FOOTER_DEFAULTS: FooterData = {
  description:
    "We are a handloom sarees & dresses seller located in Ongole, Andhra Pradesh, India. Every saree is sourced directly from master weavers — celebrating India's rich textile heritage, one thread at a time.",
  tagline: 'Proudly Made in India',
  email: 'dyuthipattusarees@gmail.com',
  phone: '+91 70757 99039, +91 70757 92599',
  address: 'Gandhi Rd, Gadiyaram Vari Veedhi, Bandla Metla, Ongole, Andhra Pradesh - 523001',
  facebook: '',
  instagram: '',
  youtube: '',
}

// Merge a stored `data` blob over the defaults, ignoring empty/blank overrides
// for text so a cleared field falls back to the default rather than showing blank.
export function resolveFooterData(data?: Record<string, unknown> | null): FooterData {
  const d = (data || {}) as Partial<Record<keyof FooterData, string>>
  const pick = (k: keyof FooterData) => {
    const v = typeof d[k] === 'string' ? (d[k] as string).trim() : ''
    return v || FOOTER_DEFAULTS[k]
  }
  return {
    description: pick('description'),
    tagline: pick('tagline'),
    email: pick('email'),
    phone: pick('phone'),
    address: pick('address'),
    // Social URLs may legitimately be empty (no link) — keep as-is, don't default.
    facebook: (typeof d.facebook === 'string' ? d.facebook.trim() : '') || '',
    instagram: (typeof d.instagram === 'string' ? d.instagram.trim() : '') || '',
    youtube: (typeof d.youtube === 'string' ? d.youtube.trim() : '') || '',
  }
}
