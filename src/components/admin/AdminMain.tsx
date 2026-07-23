'use client'

import { useEffect } from 'react'
import { useAdminPrefs } from '@/lib/admin-prefs'

// Applies the admin's Theme preference (light / dark / system) by toggling the
// `dark` class + color-scheme on <html>. Client wrapper so it can read the
// browser-stored preference.
export default function AdminMain({ children }: { children: React.ReactNode }) {
  const [prefs] = useAdminPrefs()
  const theme = prefs.appearance.theme

  useEffect(() => {
    const el = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      el.classList.toggle('dark', dark)
      el.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    mq.addEventListener('change', apply)
    return () => { mq.removeEventListener('change', apply); el.classList.remove('dark'); el.style.colorScheme = '' }
  }, [theme])

  return <main className="flex-1 min-w-0 px-4 py-6">{children}</main>
}
