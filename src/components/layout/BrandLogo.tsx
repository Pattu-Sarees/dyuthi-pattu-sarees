import Image from 'next/image'

// Brand logo shown as-is (square artwork) + brand wordmark.
// light=true for dark backgrounds (footer); default dark text for the cream navbar.
export default function BrandLogo({
  logo = '/logo-v3.jpeg',
  light = false,
  priority = false,
  hoverZoom = false,
}: {
  logo?: string
  light?: boolean
  priority?: boolean
  hoverZoom?: boolean
}) {
  const gold = light ? '#E9C767' : '#C9A227'
  return (
    <span className="flex items-center gap-1">
      {/* Fixed box fills the header height; the image is scaled up inside it so the
          icons crop past the artwork's dark margin and read larger + sharper. */}
      <span className={`relative flex-shrink-0 overflow-hidden rounded-lg h-14 w-14 md:h-[5.75rem] md:w-[5.75rem] ${hoverZoom ? 'hover:z-[60]' : ''}`}>
        <Image
          src={logo}
          alt="Dyuthi Pattu Sarees"
          width={512}
          height={512}
          priority={priority}
          className={`h-full w-full object-cover scale-[1.35] transition-transform duration-300 ease-out ${hoverZoom ? 'hover:scale-[1.6] hover:shadow-xl' : ''}`}
        />
      </span>
      <span className="leading-tight flex flex-col items-stretch w-fit">
        <span
          className={`block text-base md:text-2xl font-bold tracking-wide ${light ? 'text-[#F4E5C2]' : 'text-[#4E1E24]'}`}
          style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}
        >
          Dyuthi Pattu Sarees
        </span>
        <span className={`flex w-full items-center justify-center gap-1.5 md:gap-2 text-[11px] md:text-xs tracking-wide ${light ? 'text-[#C9A86A]' : 'text-[#A88C57]'}`}>
          <span aria-hidden className="h-px flex-1 min-w-0" style={{ background: `linear-gradient(to right, transparent, ${gold})` }} />
          <span aria-hidden className="h-[5px] w-[5px] rotate-45 flex-shrink-0" style={{ backgroundColor: gold }} />
          <span className="flex-shrink-0">Looms to Homes</span>
          <span aria-hidden className="h-[5px] w-[5px] rotate-45 flex-shrink-0" style={{ backgroundColor: gold }} />
          <span aria-hidden className="h-px flex-1 min-w-0" style={{ background: `linear-gradient(to left, transparent, ${gold})` }} />
        </span>
      </span>
    </span>
  )
}
