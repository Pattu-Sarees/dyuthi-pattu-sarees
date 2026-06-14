import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dyuthi Pattu Sarees | Authentic Indian Sarees',
  description: 'Shop authentic handloom sarees — silk, cotton, Banarasi, Kanjivaram, and more. Free shipping above ₹999.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const isMaintenance = headerList.get('x-maintenance') === '1'

  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen flex flex-col bg-gray-50`}>
        {isMaintenance ? (
          children
        ) : (
          <>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </>
        )}
      </body>
    </html>
  )
}
