// Base colour vocabulary — words we can recognise inside a custom colour name.
const BASE: Record<string, string> = {
  red: '#e53935', crimson: '#dc143c', maroon: '#7a1f3d', rust: '#b7410e', brick: '#9c3b2e', burgundy: '#800020', wine: '#5e2129',
  pink: '#e91e63', rose: '#c2185b', magenta: '#c2185b', fuchsia: '#d500f9', blush: '#f4c2c2', salmon: '#fa8072', coral: '#ff7043',
  orange: '#fb8c00', peach: '#ffd1b3', apricot: '#fbceb1', saffron: '#f4c430', kesar: '#f4a100',
  yellow: '#fdd835', lemon: '#fff176', mustard: '#c9a227', gold: '#b8860b', turmeric: '#e1a100',
  green: '#43a047', olive: '#808000', mint: '#98ff98', lime: '#9ccc65', teal: '#00897b', emerald: '#2e7d53', mehendi: '#7b8b3d',
  blue: '#1e88e5', navy: '#0d1b4c', indigo: '#3f51b5', turquoise: '#26c6da', aqua: '#7fdbda', peacock: '#1c5d7a', cyan: '#00bcd4',
  purple: '#8e24aa', violet: '#ab47bc', lavender: '#b39ddb', plum: '#8e4585', mauve: '#c8a2c8',
  black: '#212121', charcoal: '#36454f', grey: '#9e9e9e', gray: '#9e9e9e', silver: '#c0c0c0',
  white: '#fafafa', cream: '#f3e5ab', ivory: '#fffff0', beige: '#e8d5b7', brown: '#6d4c41', tan: '#d2b48c', copper: '#b87333',
}

function hexToRgb(h: string): [number, number, number] {
  const n = h.replace('#', '')
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// Derive a swatch hex from a free-text colour name by recognising colour words
// and mixing them. Handles "-ish" (lighter weight) and light/dark modifiers.
// Returns null when no colour word is recognised (→ shown as an "✕" swatch).
export function blendFromName(name: string): string | null {
  const words = name.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
  let light = 0
  let dark = 0
  const parts: { rgb: [number, number, number]; weight: number }[] = []
  for (const w of words) {
    if (['light', 'pale', 'soft', 'baby', 'powder'].includes(w)) { light++; continue }
    if (['dark', 'deep', 'bright'].includes(w)) { dark++; continue }
    let base = w
    let weight = 1
    if (w.endsWith('ish')) { base = w.slice(0, -3); weight = 0.5 } // "blueish" → hint of blue
    const hex = BASE[base] || BASE[w]
    if (hex) parts.push({ rgb: hexToRgb(hex), weight })
  }
  if (parts.length === 0) return null

  const tw = parts.reduce((s, p) => s + p.weight, 0)
  let r = parts.reduce((s, p) => s + p.rgb[0] * p.weight, 0) / tw
  let g = parts.reduce((s, p) => s + p.rgb[1] * p.weight, 0) / tw
  let b = parts.reduce((s, p) => s + p.rgb[2] * p.weight, 0) / tw

  // Shift toward white (light) or black (dark).
  const shift = (light - dark) * 38
  r += shift; g += shift; b += shift
  return rgbToHex([r, g, b])
}

// Named saree shades (single + multi-word) for resolving a colour name to a swatch.
const NAMED: Record<string, string> = {
  ...BASE,
  'rani pink': '#e0115f', gajari: '#f45b69', kesar: '#f4a100', saffron: '#f4c430', mehendi: '#7b8b3d',
  elaichi: '#b5c689', firozi: '#3fb8af', aqua: '#7fdbda', 'powder blue': '#b0e0e6', 'peacock blue': '#1c5d7a',
  burgundy: '#800020', chandan: '#eadac1', sandal: '#d9bf8c', apricot: '#fbceb1', 'steel blue': '#4682b4',
  'sky blue': '#81d4fa', 'light blue': '#b3e5fc', 'royal blue': '#283593', 'dark green': '#1b5e20',
  'light green': '#a5d6a7', 'bottle green': '#0b3d2e', 'sea green': '#2e8b57', 'dark red': '#8b0000',
  'hot pink': '#ff4081', 'baby pink': '#f8bbd0', 'off white': '#f5f5f0', 'grey green': '#8a9a5b',
}

// Resolve a colour name to a hex for display (named palette first, then a live blend).
// Returns null when nothing can be derived (caller shows a neutral/✕ swatch).
export function colorNameToHex(name?: string | null): string | null {
  if (!name) return null
  const key = name.trim().toLowerCase()
  return NAMED[key] || blendFromName(name)
}
