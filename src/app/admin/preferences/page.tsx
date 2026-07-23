'use client'

import { useAdminPrefs, type AdminPrefs, type DashboardPeriod, type RowsPerPage, type Theme, type SidebarState } from '@/lib/admin-prefs'
import { PRESETS } from '@/components/admin/DateRangeFilter'
import { Bell, LayoutDashboard, Palette, ShoppingCart, Users, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const selectCls = 'h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#AD1457]'

function Toggle({ checked, onChange, label, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: typeof Bell }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="flex items-center gap-2 text-sm text-gray-700">{Icon && <Icon className="h-4 w-4 text-gray-400" />} {label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#AD1457]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div><p className="text-sm text-gray-700">{label}</p>{hint && <p className="text-[11px] text-gray-400">{hint}</p>}</div>
      {children}
    </div>
  )
}

function Section({ icon: Icon, title, subtitle, children }: { icon: typeof Bell; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
      <div className="flex items-start gap-3 mb-2">
        <span className="h-9 w-9 rounded-lg bg-rose-50 text-[#AD1457] flex items-center justify-center flex-shrink-0"><Icon className="h-4.5 w-4.5" /></span>
        <div><h2 className="font-semibold text-gray-900">{title}</h2><p className="text-xs text-gray-400">{subtitle}</p></div>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

export default function AdminPreferencesPage() {
  const [prefs, setPrefs] = useAdminPrefs()
  const saved = () => toast.success('Preference saved')

  const setN = (k: keyof AdminPrefs['notifications'], v: boolean) => { setPrefs({ ...prefs, notifications: { ...prefs.notifications, [k]: v } }); saved() }
  const setD = <K extends keyof AdminPrefs['dashboard']>(k: K, v: AdminPrefs['dashboard'][K]) => { setPrefs({ ...prefs, dashboard: { ...prefs.dashboard, [k]: v } }); saved() }
  const setA = <K extends keyof AdminPrefs['appearance']>(k: K, v: AdminPrefs['appearance'][K]) => { setPrefs({ ...prefs, appearance: { ...prefs.appearance, [k]: v } }); saved() }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-5" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Settings</h1>

      <Section icon={Bell} title="Notification Preferences" subtitle="Choose which alerts appear in your notification bell.">
        <Toggle icon={ShoppingCart} label="New Orders" checked={prefs.notifications.new_order} onChange={(v) => setN('new_order', v)} />
        <Toggle icon={Users} label="New Leads" checked={prefs.notifications.new_lead} onChange={(v) => setN('new_lead', v)} />
        <Toggle icon={AlertTriangle} label="Low Stock Alerts" checked={prefs.notifications.low_stock} onChange={(v) => setN('low_stock', v)} />
        <Toggle icon={XCircle} label="Order Cancelled" checked={prefs.notifications.order_cancelled} onChange={(v) => setN('order_cancelled', v)} />
      </Section>

      <Section icon={LayoutDashboard} title="Dashboard Preferences" subtitle="Customize dashboard behaviour and listing pages.">
        <Row label="Default Dashboard Period" hint="Period the dashboard loads on open">
          <select value={prefs.dashboard.period} onChange={(e) => setD('period', e.target.value as DashboardPeriod)} className={selectCls}>
            {PRESETS.filter((p) => p.key !== 'custom').map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </Row>
        <Row label="Rows Per Page" hint="Records per page on Products, Orders, Customers, Leads, Inventory">
          <select value={prefs.dashboard.rowsPerPage} onChange={(e) => setD('rowsPerPage', Number(e.target.value) as RowsPerPage)} className={selectCls}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Row>
      </Section>

      <Section icon={Palette} title="Appearance" subtitle="Personal UI preferences for the admin panel.">
        <Row label="Theme" hint="Light, Dark, or follow your device">
          <select value={prefs.appearance.theme} onChange={(e) => setA('theme', e.target.value as Theme)} className={selectCls}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </Row>
        <Row label="Sidebar Default State" hint="How the sidebar looks after login">
          <select value={prefs.appearance.sidebar} onChange={(e) => setA('sidebar', e.target.value as SidebarState)} className={selectCls}>
            <option value="expanded">Expanded</option>
            <option value="collapsed">Collapsed</option>
          </select>
        </Row>
      </Section>

      <p className="text-xs text-gray-400">Preferences are saved to this browser instantly.</p>
    </div>
  )
}
