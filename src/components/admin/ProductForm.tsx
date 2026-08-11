'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { blendFromName } from '@/lib/color-blend'
import { toTitleCase } from '@/lib/utils'
import { useFormDraft, clearFormDraft } from '@/lib/useFormDraft'
import NavigationGuard from '@/components/NavigationGuard'
import Image from 'next/image'
import Link from 'next/link'
import { Product, InventoryItem, Vendor } from '@/types'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, ImagePlus, ChevronDown, Search, X, GripVertical } from 'lucide-react'
import { DEFAULT_CATEGORIES, type ProductCategory } from '@/lib/categories'
import { processImageForUpload, uploadProcessedImage, uploadRawViaServer, isHeicFile } from '@/lib/clientImageUpload'

const FABRICS = ['silk', 'pure silk', 'blended silk', 'cotton', 'soft silk', 'linen', 'sico', 'pattu']

// Resolve once the given image URL has fully loaded (so we only swap the preview
// out after the final image is ready — never a flash of a broken tile).
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

// Swatch palette for the per-variant colour selector — light, dark & blended shades.
const SAREE_COLORS: { name: string; hex: string }[] = [
  // Reds & maroons
  { name: 'Red', hex: '#E53935' }, { name: 'Bright Red', hex: '#FF1744' }, { name: 'Dark Red', hex: '#8B0000' },
  { name: 'Crimson', hex: '#DC143C' }, { name: 'Maroon', hex: '#7A1F3D' }, { name: 'Rust', hex: '#B7410E' }, { name: 'Brick', hex: '#9C3B2E' },
  // Pinks
  { name: 'Pink', hex: '#E91E63' }, { name: 'Hot Pink', hex: '#FF4081' }, { name: 'Baby Pink', hex: '#F8BBD0' },
  { name: 'Rose', hex: '#C2185B' }, { name: 'Blush', hex: '#F4C2C2' }, { name: 'Fuchsia', hex: '#D500F9' }, { name: 'Onion Pink', hex: '#E39FA9' },
  // Oranges & peach
  { name: 'Orange', hex: '#FB8C00' }, { name: 'Dark Orange', hex: '#EF6C00' }, { name: 'Coral', hex: '#FF7043' }, { name: 'Peach', hex: '#FFD1B3' },
  // Yellows & gold
  { name: 'Yellow', hex: '#FDD835' }, { name: 'Lemon', hex: '#FFF176' }, { name: 'Mustard', hex: '#C9A227' }, { name: 'Gold', hex: '#B8860B' }, { name: 'Turmeric', hex: '#E1A100' },
  // Greens
  { name: 'Green', hex: '#43A047' }, { name: 'Light Green', hex: '#A5D6A7' }, { name: 'Dark Green', hex: '#1B5E20' },
  { name: 'Bottle Green', hex: '#0B3D2E' }, { name: 'Olive', hex: '#808000' }, { name: 'Mint', hex: '#98FF98' },
  { name: 'Lime', hex: '#9CCC65' }, { name: 'Teal', hex: '#00897B' }, { name: 'Emerald', hex: '#2E7D53' }, { name: 'Sea Green', hex: '#2E8B57' },
  // Blues
  { name: 'Blue', hex: '#1E88E5' }, { name: 'Sky Blue', hex: '#81D4FA' }, { name: 'Light Blue', hex: '#B3E5FC' },
  { name: 'Royal Blue', hex: '#283593' }, { name: 'Navy', hex: '#0D1B4C' }, { name: 'Peacock', hex: '#005F73' }, { name: 'Turquoise', hex: '#26C6DA' }, { name: 'Indigo', hex: '#3F51B5' },
  // Purples
  { name: 'Purple', hex: '#8E24AA' }, { name: 'Violet', hex: '#AB47BC' }, { name: 'Lavender', hex: '#B39DDB' },
  { name: 'Wine', hex: '#5E2129' }, { name: 'Plum', hex: '#8E4585' }, { name: 'Mauve', hex: '#C8A2C8' },
  // Neutrals & metallics
  { name: 'Black', hex: '#212121' }, { name: 'Charcoal', hex: '#36454F' }, { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Silver', hex: '#C0C0C0' }, { name: 'White', hex: '#FAFAFA' }, { name: 'Off White', hex: '#F5F5F0' },
  { name: 'Cream', hex: '#F3E5AB' }, { name: 'Ivory', hex: '#FFFFF0' }, { name: 'Beige', hex: '#E8D5B7' },
  { name: 'Brown', hex: '#6D4C41' }, { name: 'Tan', hex: '#D2B48C' }, { name: 'Copper', hex: '#B87333' },
  // Popular Indian saree shades
  { name: 'Rani Pink', hex: '#E0115F' }, { name: 'Gajari', hex: '#F45B69' }, { name: 'Salmon', hex: '#FA8072' },
  { name: 'Kesar', hex: '#F4A100' }, { name: 'Saffron', hex: '#F4C430' }, { name: 'Mehendi', hex: '#7B8B3D' },
  { name: 'Elaichi', hex: '#B5C689' }, { name: 'Firozi', hex: '#3FB8AF' }, { name: 'Aqua', hex: '#7FDBDA' },
  { name: 'Powder Blue', hex: '#B0E0E6' }, { name: 'Peacock Blue', hex: '#1C5D7A' }, { name: 'Burgundy', hex: '#800020' },
  { name: 'Chandan', hex: '#EADAC1' }, { name: 'Sandal', hex: '#D9BF8C' }, { name: 'Apricot', hex: '#FBCEB1' },
  { name: 'Grey Green', hex: '#8A9A5B' }, { name: 'Steel Blue', hex: '#4682B4' }, { name: 'Magenta', hex: '#C2185B' },
  // Blended / special
  { name: 'Multicolour', hex: 'multi' }, { name: 'Half & Half', hex: 'half' }, { name: 'Ombre', hex: 'ombre' },
]
// A palette entry: hex may be a real "#rrggbb", a blended special
// ('multi'|'half'|'ombre'), or null (couldn't be blended → "✕" swatch).
type Swatch = { name: string; hex: string | null }

// Background style for a resolved hex/special. null is rendered as "✕" in JSX.
function swatchStyleFromHex(hex: string | null | undefined): React.CSSProperties {
  if (hex === 'multi') return { background: 'conic-gradient(from 0deg,#ef4444,#f59e0b,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)' }
  if (hex === 'half') return { background: 'linear-gradient(90deg,#7A1F3D 50%,#B8860B 50%)' }
  if (hex === 'ombre') return { background: 'linear-gradient(180deg,#E91E63,#7B1FA2)' }
  if (hex && /^#/.test(hex)) return { backgroundColor: hex }
  return { backgroundColor: '#f3f4f6' } // ✕ placeholder base
}

// A single swatch circle; shows "✕" when the colour has no derivable hex.
function SwatchDot({ hex, className = '', style }: { hex: string | null | undefined; className?: string; style?: React.CSSProperties }) {
  const isUnknown = hex === null || hex === undefined
  return (
    <span className={`inline-flex items-center justify-center rounded-full border border-black/10 ${className}`} style={{ ...swatchStyleFromHex(hex), ...style }}>
      {isUnknown && <span className="text-[9px] font-bold text-gray-400 leading-none">✕</span>}
    </span>
  )
}

// Colour-swatch selector shown against each parent variant row. Palette = base
// shades + shared custom colours; a free-text box blends new colours by name.
function ColorSwatchSelect({
  value,
  onChange,
  palette,
  onAddCustom,
}: {
  value: string
  onChange: (name: string) => void
  palette: Swatch[]
  onAddCustom: (name: string, hex?: string) => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [notice, setNotice] = useState('') // "already exists" info message
  const [customHex, setCustomHex] = useState('') // exact colour — empty until entered/picked
  const [hexText, setHexText] = useState('')     // editable/pasteable hex text field (empty = show placeholder)

  // Normalise anything the admin types or PASTES ("b76e79", "#B76E79", " #b76e79 ",
  // or a 3-digit "#f0a") into a valid 6-digit hex, and keep the picker in sync.
  const onHexText = (raw: string) => {
    setHexText(raw)
    let v = raw.trim().replace(/^#*/, '')
    if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.split('').map((ch) => ch + ch).join('') // #f0a -> #ff00aa
    if (/^[0-9a-fA-F]{6}$/.test(v)) setCustomHex('#' + v.toLowerCase())
  }
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Resolve the hex for display: palette first, else a live client-side blend.
  const hexOf = (name: string): string | null | undefined => {
    if (!name) return 'transparent'
    const found = palette.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (found) return found.hex
    return blendFromName(name) // string | null
  }

  const applyCustom = async () => {
    const c = toTitleCase(custom.trim()) // always store custom colours in Title Case
    if (!c) return
    // Don't create a duplicate: if the name already exists in the palette,
    // tell the admin and just select the existing swatch instead of adding.
    const existing = palette.find((p) => p.name.trim().toLowerCase() === c.toLowerCase())
    if (existing) {
      setNotice(`"${existing.name}" already exists — select it from the palette above.`)
      onChange(toTitleCase(existing.name))
      setCustom('')
      return
    }
    await onAddCustom(c, customHex) // save the EXACT picked colour, not a name-guess
    onChange(c)
    setCustom('')
    setHexText('')
    setCustomHex('')
    setNotice('')
    setOpen(false)
  }
  const hexValid = /^#[0-9a-fA-F]{6}$/.test(customHex)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 h-9 w-[96px] px-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:border-[#C2185B] hover:text-[#C2185B]"
      >
        <SwatchDot hex={hexOf(value)} className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 truncate text-left">{value || 'Color'}</span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 p-2">
          <div className="grid grid-cols-7 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {palette.map((c) => (
              <button
                type="button"
                key={c.name}
                title={c.name}
                onClick={() => { onChange(toTitleCase(c.name)); setOpen(false) }}
                className={`rounded-full ${(value || '').toLowerCase() === c.name.toLowerCase() ? 'ring-2 ring-offset-1 ring-[#C2185B]' : ''}`}
              >
                <SwatchDot hex={c.hex} className="h-7 w-7" />
              </button>
            ))}
          </div>
          {/* Custom colour — paste/type the EXACT hex (or pick it) + name it. Saved for reuse. */}
          <div className="mt-2 border-t border-gray-100 pt-2 space-y-1.5">
            {/* Hex row — text field is primary so a copied "#b76e79" can be pasted. */}
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={hexValid ? customHex : '#b76e79'}
                onChange={(e) => { setCustomHex(e.target.value); setHexText(e.target.value) }}
                title="Or pick the exact colour"
                className="h-8 w-9 flex-shrink-0 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                value={hexText}
                onChange={(e) => onHexText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCustom() } }}
                placeholder="#B76E79"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 h-8 px-2 rounded-md border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
              />
            </div>
            {/* Name row */}
            <div className="flex items-center gap-1.5">
              <input
                value={custom}
                onChange={(e) => { setCustom(e.target.value); if (notice) setNotice('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCustom() } }}
                placeholder="Colour name (e.g. Dusty Pink)"
                className="flex-1 min-w-0 h-8 px-2 rounded-md border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
              />
              <button type="button" onClick={applyCustom} disabled={!custom.trim() || !hexValid} className="h-8 px-2.5 flex-shrink-0 rounded-md bg-[#C2185B] text-white text-xs font-medium hover:bg-[#a01049] disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
            </div>
            {notice
              ? <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-1">{notice}</p>
              : <p className="text-[10px] text-gray-400">Paste or type the hex code (e.g. <span className="font-mono">#B76E79</span>) — or pick it on the left — then name it. Saved for reuse.</p>}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="mt-1.5 w-full text-xs text-gray-500 hover:text-red-600 py-1">
              Clear colour
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// A row in the form. `isNew` marks photos/colours added during this edit —
// their quantity is editable (first-time stock entry). Existing rows are locked.
// `tempId`/`pending` track an optimistic row whose photo is still uploading in
// the background (shown instantly via a local preview, swapped for the real URL).
type Row = InventoryItem & { isNew?: boolean; tempId?: string; pending?: boolean }

// A stale local-preview URL (blob:/pending:) accidentally saved by an older
// build — these are dead on reload and render as broken tiles, so drop them.
const isStaleUrl = (u: string) => !u || u.startsWith('blob:') || u.startsWith('pending:')

// Handle old data shapes gracefully
function normalise(variants?: Array<Partial<InventoryItem> & { image?: string; images?: string[] }>): Row[] {
  if (!variants?.length) return []
  return variants.flatMap((v) => {
    const flags = {
      color: (v as { color?: string }).color || '',
      is_new_arrival: !!v.is_new_arrival,
      is_best_seller: !!v.is_best_seller,
      // Drop any stale blob:/pending: angle URLs left over from older saves.
      additional_images: (Array.isArray(v.additional_images) ? v.additional_images : []).filter((u) => !isStaleUrl(u)),
    }
    // Skip a row whose main image is itself a dead placeholder.
    if (v.image && !isStaleUrl(v.image)) return [{ image: v.image, quantity: Number(v.quantity) || 1, ...flags }]
    if (v.images?.length) return v.images.filter((img) => !isStaleUrl(img)).map((img) => ({ image: img, quantity: Number(v.quantity) || 1, ...flags }))
    return []
  })
}

// Single searchable vendor picker — used once per procurement row.
function VendorPicker({ vendors, value, onChange }: {
  vendors: Vendor[]
  value: string
  onChange: (vendor: Vendor) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = vendors.find((v) => v.id === value)
  const filtered = query
    ? vendors.filter((v) => v.vendor_name.toLowerCase().includes(query.toLowerCase()))
    : vendors

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery('') }}
        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#C2185B] bg-white"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.vendor_name : 'Select vendor…'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendors…"
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">
                {vendors.length === 0 ? 'No active vendors. Add one in the Vendors module.' : 'No vendors match your search.'}
              </p>
            ) : filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { onChange(v); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-rose-50 transition-colors ${v.id === value ? 'bg-rose-50 text-[#AD1457] font-semibold' : 'text-gray-700'}`}
              >
                {v.vendor_name}
                {v.notes && <span className="block text-xs text-gray-400 line-clamp-1">{v.notes}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// One editable procurement row in the form (string-typed for inputs).
type ProcRow = { vendor_id: string; purchase_cost: string; purchase_date: string; invoice_number: string; notes: string }
const EMPTY_PROC: ProcRow = { vendor_id: '', purchase_cost: '', purchase_date: '', invoice_number: '', notes: '' }

// Seed the procurement rows from a product: prefer the new per-vendor records,
// fall back to the older single/multi-vendor shape, else one blank row.
function initProcurements(p?: Product): ProcRow[] {
  if (p?.procurements && p.procurements.length) {
    return p.procurements.map((e) => ({
      vendor_id: e.vendor_id || '',
      purchase_cost: e.purchase_cost != null ? String(e.purchase_cost) : '',
      purchase_date: e.purchase_date || '',
      invoice_number: e.invoice_number || '',
      notes: e.notes || '',
    }))
  }
  const ids = p?.vendor_ids?.length ? p.vendor_ids : (p?.vendor_id ? [p.vendor_id] : [])
  if (ids.length) {
    return ids.map((id, i) => ({
      vendor_id: id,
      purchase_cost: i === 0 && p?.purchase_cost != null ? String(p.purchase_cost) : '',
      purchase_date: i === 0 ? (p?.purchase_date || '') : '',
      invoice_number: i === 0 ? (p?.invoice_number || '') : '',
      notes: i === 0 ? (p?.procurement_notes || '') : '',
    }))
  }
  return [{ ...EMPTY_PROC }]
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  // Number of photos still uploading in the background. `uploading` (derived)
  // keeps existing JSX working and gates Save until all uploads finish.
  const [pendingCount, setPendingCount] = useState(0)
  const uploading = pendingCount > 0

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    code: product?.code || '',
    price: product?.price?.toString() || '',
    original_price: product?.original_price?.toString() || '',
    priority: product?.priority?.toString() ?? '',
    category: product?.category || DEFAULT_CATEGORIES[0].slug,
    fabric: product?.fabric || 'pure silk',
    region: product?.region || '',
    occasion: product?.occasion?.join(', ') || '',
    status: product?.status ?? 'active',
    procurements: initProcurements(product) as ProcRow[],
    video_watermark: product?.video_watermark ?? '',
    video_urls: (product?.video_urls?.length
      ? product.video_urls
      : (product?.video_url ? [product.video_url] : [''])) as string[],
  })
  const MAX_VIDEOS = 2
  // Hold the typed product details for 10 min so a refresh doesn't wipe them.
  const draftKey = `draft:product:${product?.id ?? 'new'}`
  useFormDraft(draftKey, form, setForm)
  // Categories are admin-managed — load them from the DB (fall back to the
  // built-in list so the dropdown is never empty while the fetch is in flight).
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES)
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(({ categories }) => { if (Array.isArray(categories) && categories.length) setCategories(categories) })
      .catch(() => {})
  }, [])
  const [vendors, setVendors] = useState<Vendor[]>([])

  // Active vendors for the procurement dropdown
  useEffect(() => {
    fetch('/api/admin/vendors?status=active')
      .then((r) => r.json())
      .then(({ vendors }) => setVendors(vendors || []))
      .catch(() => {})
  }, [])
  const [items, setItems] = useState<Row[]>(normalise(product?.color_variants))
  // Row index pending delete confirmation (parent variant/photo).
  const [confirmDeleteRow, setConfirmDeleteRow] = useState<number | null>(null)
  // Angle image URLs that failed to load (corrupt/missing stored files). We show
  // a neutral "Unavailable" tile for these instead of a broken image, and NEVER
  // auto-delete them — the admin removes them with the ✕ and re-uploads.
  const [brokenAngles, setBrokenAngles] = useState<Set<string>>(new Set())
  const markAngleBroken = (url: string) => setBrokenAngles((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  // Per-vendor procurement row helpers.
  const setProc = (i: number, patch: Partial<ProcRow>) =>
    setForm((f) => ({ ...f, procurements: f.procurements.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }))
  const addProc = () =>
    setForm((f) => ({ ...f, procurements: [...f.procurements, { ...EMPTY_PROC }] }))
  const removeProc = (i: number) =>
    setForm((f) => ({ ...f, procurements: f.procurements.length > 1 ? f.procurements.filter((_, idx) => idx !== i) : f.procurements }))

  // Product video links (usually one, up to MAX_VIDEOS).
  const setVideo = (i: number, url: string) =>
    setForm((f) => ({ ...f, video_urls: f.video_urls.map((u, idx) => (idx === i ? url : u)) }))
  const addVideo = () =>
    setForm((f) => (f.video_urls.length >= MAX_VIDEOS ? f : { ...f, video_urls: [...f.video_urls, ''] }))
  const removeVideo = (i: number) =>
    setForm((f) => ({ ...f, video_urls: f.video_urls.length > 1 ? f.video_urls.filter((_, idx) => idx !== i) : [''] }))

  // Which rows have their "Additional Photos" (Angles) panel expanded.
  const [openAngles, setOpenAngles] = useState<Record<number, boolean>>({})
  // Which rows are currently showing an empty upload box (one per click of
  // "Add Additional Photos"). It closes after a photo is picked; click again to
  // add another. This lets you add multiple angles, one box at a time.
  const [angleBoxOpen, setAngleBoxOpen] = useState<Record<number, boolean>>({})
  const openAngleUpload = (i: number) => {
    setOpenAngles((p) => ({ ...p, [i]: true }))
    setAngleBoxOpen((p) => ({ ...p, [i]: true }))
  }

  // Pieces being added via brand-new colour rows in this edit session.
  const addedQty = items.reduce((s, it) => s + (it.isNew ? Number(it.quantity) || 0 : 0), 0)
  // Pieces removed by deleting existing rows (their original DB quantity).
  const currentImages = new Set(items.map((it) => it.image))
  const removedQty = normalise(product?.color_variants)
    .filter((v) => !currentImages.has(v.image))
    .reduce((s, v) => s + (Number(v.quantity) || 0), 0)

  // On new products, stock = sum of entered quantities. On edit, the Inventory
  // module owns the running total, so start from the product's authoritative
  // count and project the delta from added/removed colours.
  const currentStock = product?.stock_quantity ?? 0
  const totalStock = isEdit
    ? Math.max(0, currentStock - removedQty + addedQty)
    : items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  const stockChanged = isEdit && totalStock !== currentStock

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    // Show a loading tile first. We build the real preview from the PROCESSED
    // JPEG (so HEIC previews aren't broken), then upload and swap in the final
    // URL. The admin never waits for it.
    const staged = files.map((file) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      return { file, tempId: id }
    })

    setItems((prev) => [
      ...prev,
      ...staged.map((s) => ({
        image: `pending:${s.tempId}`,
        quantity: 1,
        isNew: true,
        tempId: s.tempId,
        pending: true,
      })),
    ])
    setPendingCount((c) => c + staged.length)

    for (const s of staged) {
      let localUrl = ''
      ;(async () => {
        // INSTANT preview: show the original file right away for non-HEIC (the
        // browser renders it directly), so the tile fills in a fraction of a
        // second while compression + upload happen in the background.
        if (!isHeicFile(s.file)) {
          localUrl = URL.createObjectURL(s.file)
          setItems((prev) => prev.map((it) => (it.tempId === s.tempId ? { ...it, image: localUrl } : it)))
        }
        // Try full browser processing (JPEG, or browser-decodable HEIC).
        let processed: File | null = null
        try {
          processed = await processImageForUpload(s.file)
        } catch (err) {
          if (!(isHeicFile(s.file) && (err as Error)?.message === 'HEIC_NEEDS_SERVER')) throw err
        }
        const finalUrl = processed
          ? await uploadProcessedImage(processed, { folder: 'sarees' })
          : await uploadRawViaServer(s.file, { folder: 'sarees' }) // HEIC the browser couldn't decode
        // Req 9: keep the preview until the FINAL url is loaded, then swap + revoke.
        await preloadImage(finalUrl)
        setItems((prev) => prev.map((it) => (it.tempId === s.tempId ? { ...it, image: finalUrl, pending: false } : it)))
      })()
        .catch((e) => {
          toast.error((e as Error)?.message || 'Upload failed')
          setItems((prev) => prev.filter((it) => it.tempId !== s.tempId))
        })
        .finally(() => {
          if (localUrl) URL.revokeObjectURL(localUrl)
          setPendingCount((c) => c - 1)
        })
    }
  }

  const setQty = (i: number, qty: number) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, quantity: qty } : it)))

  const toggleFlag = (i: number, key: 'is_new_arrival' | 'is_best_seller', val: boolean) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))

  const setColor = (i: number, color: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, color } : it)))

  // Shared custom-colour palette (blended colours saved by any admin).
  const [customColors, setCustomColors] = useState<{ name: string; hex: string | null }[]>([])
  useEffect(() => {
    fetch('/api/admin/colors').then((r) => r.json()).then((d) => setCustomColors(d.colors || [])).catch(() => {})
  }, [])
  // Merge built-in + custom colours, de-duplicated by name (case-insensitive) so
  // the palette never shows the same colour twice.
  const palette = useMemo<{ name: string; hex: string | null }[]>(() => {
    const seen = new Set<string>()
    const out: { name: string; hex: string | null }[] = []
    for (const c of [...(SAREE_COLORS as { name: string; hex: string | null }[]), ...customColors]) {
      const key = c.name.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(c)
    }
    return out
  }, [customColors])
  const addCustomColor = async (name: string, hex?: string) => {
    const lower = name.toLowerCase()
    // Don't shadow a built-in colour with a custom duplicate.
    if ((SAREE_COLORS as { name: string }[]).some((c) => c.name.toLowerCase() === lower)) return
    // Use the EXACT hex the admin picked; fall back to a name-blend only if none given.
    const finalHex = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : blendFromName(name)
    // Add if new, OR update the hex if this custom colour already exists (lets the
    // admin correct a previously wrong swatch). The API upserts by name.
    setCustomColors((prev) =>
      prev.some((c) => c.name.toLowerCase() === lower)
        ? prev.map((c) => (c.name.toLowerCase() === lower ? { name, hex: finalHex } : c))
        : [...prev, { name, hex: finalHex }]
    )
    fetch('/api/admin/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, hex: finalHex }),
    }).catch(() => {})
  }

  // Extra angle shots for one row — uploaded like main photos but stored on the row.
  const handleAddAngles = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    // One photo per upload box; the box closes after picking. Click "Add
    // Additional Photos" again to open a fresh box for the next angle.
    const files = Array.from(e.target.files || []).slice(0, 1)
    e.target.value = ''
    setAngleBoxOpen((p) => ({ ...p, [i]: false }))
    if (files.length === 0) return

    const staged = files.map((file) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      return { file, id, marker: `pending:${id}` }
    })

    // Show loading tiles first; the real preview is built from the processed
    // JPEG below (so HEIC previews aren't broken), then swapped for the URL.
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i
          ? { ...it, additional_images: [...(it.additional_images || []), ...staged.map((s) => s.marker)] }
          : it
      )
    )
    setPendingCount((c) => c + staged.length)

    // Swap one url value for another within this row's additional_images.
    const swap = (from: string, to: string) =>
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, additional_images: (it.additional_images || []).map((u) => (u === from ? to : u)) }
            : it
        )
      )
    const drop = (val: string) =>
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === i
            ? { ...it, additional_images: (it.additional_images || []).filter((u) => u !== val) }
            : it
        )
      )

    for (const s of staged) {
      let current = s.marker
      let localUrl = ''
      ;(async () => {
        // Instant preview from the original (non-HEIC renders directly).
        if (!isHeicFile(s.file)) {
          localUrl = URL.createObjectURL(s.file)
          swap(current, localUrl)
          current = localUrl
        }
        let processed: File | null = null
        try {
          processed = await processImageForUpload(s.file)
        } catch (err) {
          if (!(isHeicFile(s.file) && (err as Error)?.message === 'HEIC_NEEDS_SERVER')) throw err
        }
        const finalUrl = processed
          ? await uploadProcessedImage(processed, { folder: 'sarees' })
          : await uploadRawViaServer(s.file, { folder: 'sarees' }) // HEIC browser couldn't decode
        // Req 9: keep the preview until the final URL has loaded, then swap.
        await preloadImage(finalUrl)
        swap(current, finalUrl)
        current = finalUrl
      })()
        .catch((e) => {
          toast.error((e as Error)?.message || 'Upload failed')
          drop(current)
        })
        .finally(() => {
          if (localUrl) URL.revokeObjectURL(localUrl)
          setPendingCount((c) => c - 1)
        })
    }
  }

  const removeAngle = (i: number, url: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, additional_images: (it.additional_images || []).filter((u) => u !== url) } : it)))

  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  // Drag-and-drop reordering of the variant/photo rows. The saved order becomes
  // the product's image/variant order (first = main photo shown on the storefront).
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const moveItem = (from: number, to: number) => {
    if (from === to) return
    setItems((prev) => {
      const next = [...prev]
      const [m] = next.splice(from, 1)
      next.splice(to, 0, m)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    const procRows = form.procurements.filter((r) => r.vendor_id)
    if (!procRows.length) { toast.error('Vendor is required — select at least one in the Procurement section'); return }
    if (uploading || items.some((it) => it.pending)) { toast.error('Please wait — photos are still uploading'); return }
    // Guard: never persist a local blob: preview URL (only real uploaded URLs).
    const isTemp = (u: string) => u.startsWith('blob:') || u.startsWith('pending:')
    const clean = items
      .filter((it) => it.image && !isTemp(it.image))
      .map((it) => ({ image: it.image, quantity: Number(it.quantity) || 0, color: it.color || '', is_new_arrival: !!it.is_new_arrival, is_best_seller: !!it.is_best_seller, additional_images: (it.additional_images || []).filter((u) => !isTemp(u)) }))
    if (clean.length === 0) { toast.error('Add at least one photo'); return }

    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      priority: form.priority.trim() !== '' ? Number(form.priority) : null,
      stock_quantity: clean.reduce((s, it) => s + it.quantity, 0),
      color: [],
      color_variants: clean,
      occasion: form.occasion.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      images: clean.map((it) => it.image),
      // Per-vendor procurement records (cleaned).
      procurements: procRows.map((r) => ({
        vendor_id: r.vendor_id,
        purchase_cost: r.purchase_cost.trim() !== '' ? Number(r.purchase_cost) : null,
        purchase_date: r.purchase_date || null,
        invoice_number: r.invoice_number.trim() || null,
        notes: r.notes.trim() || null,
      })),
      // Backward-compatible flat fields from the first (primary) vendor.
      vendor_ids: Array.from(new Set(procRows.map((r) => r.vendor_id))),
      vendor_id: procRows[0].vendor_id,
      purchase_cost: procRows[0].purchase_cost.trim() !== '' ? Number(procRows[0].purchase_cost) : null,
      purchase_date: procRows[0].purchase_date || null,
      invoice_number: procRows[0].invoice_number.trim() || null,
      procurement_notes: procRows[0].notes.trim() || null,
      video_watermark: form.video_watermark.trim() || null,
      video_urls: form.video_urls.map((u) => u.trim()).filter(Boolean),
      video_url: (form.video_urls.map((u) => u.trim()).filter(Boolean)[0]) || null, // first (backward compat)
    }

    const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)

    if (res.ok) {
      toast.success(isEdit ? 'Product updated!' : 'Product added!')
      clearFormDraft(draftKey) // saved — drop the recovery draft
      router.push('/admin/products') // back to the Products list, not the dashboard
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to save')
    }
  }

  const label = 'block text-sm font-medium text-gray-700 mb-1.5'
  const input = 'w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Confirm before leaving the add/edit product screen with unsaved work. */}
      <NavigationGuard />
      {/* Inventory */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Product</h2>
          <span className="text-sm font-semibold text-[#C2185B]">
            Total stock: {totalStock}
            {stockChanged && <span className="text-gray-400 font-normal"> (was {currentStock})</span>}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {isEdit
            ? 'Add new photos/colours and set their pieces here. To change the stock of an existing colour, use the Inventory module so the change is logged.'
            : 'Click “Add photos” — each photo becomes a numbered row. Set how many pieces you have of each (e.g. 4 of one, 3 of another).'}
        </p>

        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((it, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-2.5"
                onDragOver={(e) => { if (dragIndex !== null) e.preventDefault() }}
                onDrop={() => { if (dragIndex !== null) { moveItem(dragIndex, i); setDragIndex(null) } }}
              >
                {/* Everything on ONE row: drag · # · image · pieces · colour · New · Best · delete */}
                <div className="flex items-center gap-x-1.5 flex-nowrap">
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => setDragIndex(null)}
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                  className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 -ml-1"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-500 flex-shrink-0">{i + 1}</span>
                <div className="relative w-14 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                  {it.pending ? (
                    it.image.startsWith('blob:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={`Item ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100" />
                    )
                  ) : (
                    // Load the stored JPEG directly (no Next optimizer) — the
                    // optimizer can fail on a just-uploaded URL and render broken.
                    <Image src={it.image} alt={`Item ${i + 1}`} fill className="object-cover" sizes="56px" unoptimized />
                  )}
                  {it.pending && (
                    // Small corner badge — the image is already visible; this just
                    // shows the upload is still finishing in the background.
                    <div className="absolute bottom-0.5 right-0.5 rounded-full bg-black/55 p-0.5">
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">Pieces</span>
                  {!isEdit || it.isNew ? (
                    // New / unsaved row → set the starting count directly.
                    <input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      className="w-12 h-9 px-1.5 text-center rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                    />
                  ) : (
                    // Saved row → stock is owned by the Inventory module (read-only here).
                    <span className="inline-flex items-center justify-center min-w-8 h-9 px-1.5 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">{it.quantity}</span>
                  )}
                  {/* Same "Update in Inventory" link as before — now shown on every
                      row. On a saved product it opens the Inventory adjust screen;
                      on a brand-new (unsaved) product it prompts to save first. */}
                  {product?.id ? (
                    <Link href={`/admin/inventory?adjust=${product.id}&variant=${encodeURIComponent(it.image)}`} className="text-[11px] font-medium text-[#AD1457] hover:underline">Update in Inventory</Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toast.info('Save the product first, then you can update its inventory.')}
                      className="text-[11px] font-medium text-[#AD1457] hover:underline"
                    >
                      Update in Inventory
                    </button>
                  )}
                </div>
                {/* Per-item colour swatch selector (main row only) */}
                <div className="flex-shrink-0">
                  <ColorSwatchSelect value={it.color || ''} onChange={(c) => setColor(i, c)} palette={palette} onAddCustom={addCustomColor} />
                </div>
                {/* Per-item merchandising flags — same row */}
                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0 whitespace-nowrap">
                  <input type="checkbox" checked={!!it.is_new_arrival} onChange={(e) => toggleFlag(i, 'is_new_arrival', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
                  <span className="text-[11px] text-gray-600">New Arrival</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0 whitespace-nowrap">
                  <input type="checkbox" checked={!!it.is_best_seller} onChange={(e) => toggleFlag(i, 'is_best_seller', e.target.checked)} className="h-4 w-4 accent-[#C2185B]" />
                  <span className="text-[11px] text-gray-600">Best Seller</span>
                </label>
                {/* Delete icon — always last on the row */}
                <button type="button" onClick={() => setConfirmDeleteRow(i)} title="Delete item" className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>

                {/* Additional photos ("Angles") — on its own line, collapsed until clicked */}
                <div className="pl-10 mt-2">
                  <button
                    type="button"
                    onClick={() => openAngleUpload(i)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#AD1457] hover:underline"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Add Additional Photos
                    {(it.additional_images?.length || 0) > 0 && <span className="text-gray-400">({it.additional_images!.length})</span>}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${(openAngles[i] || angleBoxOpen[i] || (it.additional_images?.length || 0) > 0) ? 'rotate-180' : ''}`} />
                  </button>

                  {(openAngles[i] || angleBoxOpen[i] || (it.additional_images?.length || 0) > 0) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-gray-400">Angles:</span>
                      {(it.additional_images || []).map((url) => (
                        <div key={url} className="relative w-10 h-12 rounded-md overflow-hidden border border-gray-200 group/angle">
                          {url.startsWith('blob:') || url.startsWith('pending:') ? (
                            <>
                              {url.startsWith('blob:') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt="Additional angle" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 bg-gray-100" />
                              )}
                              <div className="absolute bottom-0.5 right-0.5 rounded-full bg-black/55 p-0.5">
                                <Loader2 className="h-3 w-3 animate-spin text-white" />
                              </div>
                            </>
                          ) : brokenAngles.has(url) ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-[7px] text-center leading-tight px-0.5">Unavailable</div>
                          ) : (
                            <Image
                              src={url}
                              alt="Additional angle"
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                              onError={() => markAngleBroken(url)}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeAngle(i, url)}
                            className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600"
                            title="Remove"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      {/* One empty upload box, shown only after clicking "Add
                          Additional Photos". It closes once a photo is picked;
                          click again to add another angle. */}
                      {angleBoxOpen[i] && (
                        <label className="inline-flex items-center gap-1 w-10 h-12 justify-center rounded-md border border-dashed border-gray-300 text-[#AD1457] hover:bg-rose-50 cursor-pointer" title="Upload an angle photo">
                          <ImagePlus className="h-4 w-4" />
                          <input type="file" accept="image/*,.heic,.heif" onChange={(e) => handleAddAngles(i, e)} className="hidden" disabled={saving} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Always active — you can keep adding photos while others upload in the
            background (each tile shows its own corner spinner until done). */}
        <label className="inline-flex items-center gap-2 cursor-pointer bg-[#C2185B] hover:bg-[#a01049] text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors">
          <ImagePlus className="h-4 w-4" />
          Add photos
          <input type="file" accept="image/*,.heic,.heif" multiple onChange={handleAddPhotos} className="hidden" disabled={saving} />
        </label>

        {/* Delete-item confirmation popup (parent variant/photo). */}
        {confirmDeleteRow !== null && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          >
            <div role="dialog" aria-label="Delete item" className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
              <p className="text-base font-semibold text-gray-900">Do you want to delete the item?</p>
              <p className="text-sm text-gray-500 mt-1">This removes this photo/variant from the product.</p>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRow(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { removeRow(confirmDeleteRow); setConfirmDeleteRow(null) }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Product Details</h2>
        <div>
          <label className={label}>Saree Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="e.g. Mangalgiri Cotton Saree" required />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="Describe the saree, weave, border, occasion..." />
        </div>
        <div>
          <label className={label}>Code</label>
          <input value={form.code} onChange={(e) => set('code', e.target.value)} className={input} placeholder="e.g. DPS-GAD-001" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Price (₹) *</label>
            <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className={input} placeholder="2999" required />
          </div>
          <div>
            <label className={label}>Original Price (₹)</label>
            <input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} className={input} placeholder="3999" />
          </div>
        </div>
        <div>
          <label className={label}>Priority <span className="text-gray-400">(optional — lower number shows first in admin list)</span></label>
          <input type="number" min={0} value={form.priority} onChange={(e) => set('priority', e.target.value)} className={input} placeholder="e.g. 1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input}>
              {/* If the saved category isn't in the current list (e.g. a legacy
                  value), show it explicitly so the admin sees the TRUE stored
                  value instead of the select silently falling back to the first
                  option — and can re-pick a valid one. */}
              {form.category && !categories.some((c) => c.slug === form.category) && (
                <option value={form.category} className="capitalize">{form.category} (unlisted — please reassign)</option>
              )}
              {categories.map((c) => <option key={c.slug} value={c.slug} className="capitalize">{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Fabric</label>
            <select value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={input}>
              {FABRICS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Region</label>
            <input value={form.region} onChange={(e) => set('region', e.target.value)} className={input} placeholder="e.g. mangalagiri" />
          </div>
          <div>
            <label className={label}>Occasions <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={input} placeholder="wedding, festival" />
          </div>
        </div>
        <div>
          <label className={label}>Video Watermark <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.video_watermark}
            onChange={(e) => set('video_watermark', e.target.value)}
            className={input}
            placeholder="www.dyuthipattusarees.com"
          />
          <p className="text-xs text-gray-400 mt-1">
            Usually leave blank — videos are already watermarked before upload. Only fill this (e.g. www.dyuthipattusarees.com) as a fallback if you uploaded a video without a burned-in watermark.
          </p>
        </div>
        <div>
          <label className={label}>Product Video <span className="text-gray-400 font-normal">(optional — opening video)</span></label>
          <div className="space-y-2">
            {form.video_urls.map((url, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setVideo(i, e.target.value)}
                  className={`${input} flex-1 min-w-0`}
                  placeholder={i === 0 ? 'Paste video link — e.g. https://videos.dyuthipattusarees.com/gadwal.mp4 or a YouTube link' : 'Second video link (optional)'}
                />
                {form.video_urls.length > 1 && (
                  <button type="button" onClick={() => removeVideo(i)} className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600" title="Remove this video">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.video_urls.length < MAX_VIDEOS && (
            <button type="button" onClick={addVideo} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#C2185B] hover:text-[#a01049]">
              <ImagePlus className="h-4 w-4" /> Add another video
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Upload the compressed MP4 to Cloudflare R2 (or paste a YouTube link) and put the public URL here. Shown as a player on the product page. Leave blank for no video.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Keep each video under ~5&nbsp;MB for fast playback — 720–1080p, ≤20&nbsp;seconds. Add a second video only when needed; more videos slow the page on mobile (max {MAX_VIDEOS}).
          </p>
        </div>
      </div>

      {/* Procurement — one set of fields per vendor. Most products have a single
          vendor (shown by default); add more only when the same design was
          bought from different sellers. */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Procurement</h2>
          <p className="text-xs text-gray-400">Only active vendors are listed — manage them in <Link href="/admin/vendors" className="text-[#AD1457] hover:underline">Vendors</Link>.</p>
        </div>

        {form.procurements.map((row, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#AD1457]">
                {i === 0 ? 'Primary vendor' : `Vendor ${i + 1}`}
              </span>
              {form.procurements.length > 1 && (
                <button type="button" onClick={() => removeProc(i)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div>
              <label className={label}>Vendor Name {i === 0 && '*'}</label>
              <VendorPicker
                vendors={vendors}
                value={row.vendor_id}
                onChange={(vendor) => setProc(i, {
                  vendor_id: vendor.id,
                  // Auto-fill this row's notes from the vendor master if still empty.
                  notes: row.notes.trim() ? row.notes : (vendor.notes || ''),
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Purchase Cost (₹)</label>
                <input type="number" min={0} step="0.01" value={row.purchase_cost} onChange={(e) => setProc(i, { purchase_cost: e.target.value })} className={input} placeholder="1500" />
              </div>
              <div>
                <label className={label}>Purchase Date</label>
                <input type="date" value={row.purchase_date} onChange={(e) => setProc(i, { purchase_date: e.target.value })} className={input} />
              </div>
            </div>

            <div>
              <label className={label}>Bill / Invoice Number</label>
              <input value={row.invoice_number} onChange={(e) => setProc(i, { invoice_number: e.target.value })} className={input} placeholder="e.g. INV-2026-0142" />
            </div>

            <div>
              <label className={label}>Procurement Notes</label>
              <textarea
                value={row.notes}
                onChange={(e) => setProc(i, { notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]"
                placeholder="Auto-fills from the vendor's notes — edit freely"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProc}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C2185B] hover:text-[#a01049]"
        >
          <ImagePlus className="h-4 w-4" /> Add another vendor
        </button>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Visibility</h2>
        <div>
          <label className={label}>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={input}>
            <option value="active">Active — visible on store</option>
            <option value="inactive">Inactive — hidden from store</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">Mark items as <span className="font-medium text-gray-600">New Arrival</span> or <span className="font-medium text-gray-600">Best Seller</span> per photo in the Product section above.</p>
      </div>

      {/* Sticky submit */}
      <div className="sticky bottom-0 bg-gray-50 pt-3 -mx-4 px-4 pb-4 border-t border-gray-100">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button type="button" onClick={() => router.push('/admin/products')} className="px-5 h-12 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className="flex-1 h-12 rounded-lg bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </form>
  )
}
