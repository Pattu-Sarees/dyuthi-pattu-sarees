'use client'

import { useEffect, useState } from 'react'

// Per-admin UI preferences (personal, stored in the browser). Kept separate from
// the store/business Settings which live in the database.
// Matches the dashboard DateRangeFilter presets (excluding 'custom').
export type DashboardPeriod = 'today' | 'yesterday' | 'last7' | 'last30' | 'month' | 'lastMonth' | 'quarter' | 'year'
const VALID_PERIODS: DashboardPeriod[] = ['today', 'yesterday', 'last7', 'last30', 'month', 'lastMonth', 'quarter', 'year']
export type RowsPerPage = 10 | 25 | 50 | 100
export type Theme = 'light' | 'dark' | 'system'
export type SidebarState = 'expanded' | 'collapsed'

export interface AdminPrefs {
  notifications: {
    new_order: boolean
    new_lead: boolean
    low_stock: boolean
    order_cancelled: boolean
  }
  dashboard: {
    period: DashboardPeriod
    rowsPerPage: RowsPerPage
  }
  appearance: {
    theme: Theme
    sidebar: SidebarState
  }
}

export const DEFAULT_PREFS: AdminPrefs = {
  notifications: { new_order: true, new_lead: true, low_stock: true, order_cancelled: true },
  dashboard: { period: 'month', rowsPerPage: 25 },
  appearance: { theme: 'system', sidebar: 'expanded' },
}

const KEY = 'admin_prefs'
const EVENT = 'admin-prefs-change'

export function loadPrefs(): AdminPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    // Merge so new keys get defaults.
    const dashboard = { ...DEFAULT_PREFS.dashboard, ...(parsed.dashboard || {}) }
    if (!VALID_PERIODS.includes(dashboard.period)) dashboard.period = 'month'
    return {
      notifications: { ...DEFAULT_PREFS.notifications, ...(parsed.notifications || {}) },
      dashboard,
      appearance: { ...DEFAULT_PREFS.appearance, ...(parsed.appearance || {}) },
    }
  } catch { return DEFAULT_PREFS }
}

export function savePrefs(p: AdminPrefs) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new CustomEvent(EVENT))
}

// Reactive hook — updates live across all components when prefs change.
export function useAdminPrefs(): [AdminPrefs, (p: AdminPrefs) => void] {
  const [prefs, setPrefs] = useState<AdminPrefs>(DEFAULT_PREFS)

  useEffect(() => {
    const sync = () => setPrefs(loadPrefs())
    // Defer the initial read so we don't setState synchronously in the effect
    // (and to avoid a hydration mismatch — server renders defaults).
    const id = setTimeout(sync, 0)
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { clearTimeout(id); window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])

  const update = (p: AdminPrefs) => { setPrefs(p); savePrefs(p) }
  return [prefs, update]
}
