import LotusAccent from '@/components/ui/LotusAccent'

export default function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-[#3a0d22] text-white py-12 md:py-14">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-3">
          <LotusAccent width={36} color="#F4C430" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="text-gray-300 mt-3 max-w-xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  )
}
