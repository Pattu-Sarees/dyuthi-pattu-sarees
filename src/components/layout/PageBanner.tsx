import LotusAccent from '@/components/ui/LotusAccent'

export default function PageBanner({ title, subtitle, emoji }: { title: React.ReactNode; subtitle?: string; emoji?: string }) {
  return (
    <section className="bg-[#4E1E24] text-white py-1.5 md:py-6">
      <div className="container mx-auto px-4 text-center">
        <div className="hidden md:flex justify-center mb-1.5">
          <LotusAccent width={26} color="#F4C430" />
        </div>
        <h1 className="text-sm md:text-2xl font-bold text-[#F4E5C2] inline-flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-kurale), serif' }}>
          {emoji && <span className="text-[0.8em] leading-none">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="text-[#E8DCC7] text-xs md:text-sm mt-0.5 md:mt-2 max-w-xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  )
}
