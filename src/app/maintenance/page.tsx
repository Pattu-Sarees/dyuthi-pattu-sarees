export const metadata = {
  title: 'Under Maintenance | Vibha Handloom Sarees',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-rose-950 via-rose-800 to-amber-800 text-white">
      <div className="max-w-lg text-center">
        <div className="text-7xl mb-6">🥻</div>
        <p className="text-amber-300 text-sm font-semibold tracking-widest uppercase mb-3">
          Vibha Handloom Sarees
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          We&apos;ll be back soon
        </h1>
        <p className="text-rose-100 text-lg leading-relaxed mb-8">
          Our store is currently undergoing scheduled maintenance to bring you an
          even better shopping experience. Please check back in a little while.
        </p>

        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-5 py-2.5 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          Maintenance in progress
        </div>

        <div className="mt-10 text-rose-200 text-sm">
          <p>Need help? Reach us at</p>
          <a href="mailto:support@vibhasarees.com" className="text-amber-300 hover:underline font-medium">
            support@vibhasarees.com
          </a>
        </div>
      </div>
    </div>
  )
}
