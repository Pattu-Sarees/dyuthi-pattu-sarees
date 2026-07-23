import Image from 'next/image'

export const metadata = { title: 'About Us | Dyuthi Pattu Sarees' }

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      {/* Full-screen background image */}
      <Image
        src="/about-weaving.png"
        alt="Artisan weaving a handloom saree on a traditional loom"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      {/* Ivory veil to fade the image so text stays readable */}
      <div className="absolute inset-0 bg-[#FFFDF7]/40" />

      {/* Content on top */}
      <div className="relative container mx-auto px-4 py-12 max-w-5xl">
        <h1
          className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24] mb-10"
          style={{ fontFamily: 'var(--font-kurale), serif' }}
        >
          About Us
        </h1>

        <div className="bg-[#FFFDF7]/45 backdrop-blur-sm rounded-2xl p-6 md:p-10 shadow-sm text-gray-900 font-medium text-sm md:text-[15px] leading-relaxed space-y-5">
          <h2 className="text-lg md:text-xl font-bold text-[#4E1E24]">
            Preserving Traditions, Celebrating Timeless Weaves
          </h2>

          <p>
            Welcome to <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong>, a destination
            inspired by the enduring beauty of India&apos;s handloom traditions.
          </p>

          <p>
            Every handloom saree carries a story woven through generations of skill, dedication, and craftsmanship.
            Rooted in time-honored weaving traditions, these creations reflect the artistry and cultural richness that
            have made Indian handlooms cherished across generations.
          </p>

          <p>
            At Dyuthi, we celebrate this legacy through thoughtfully curated collections featuring some of India&apos;s
            most admired weaves, including Kanchi Pattu, Gadwal, and other treasured handloom traditions. Each saree is
            selected for its exceptional craftsmanship, intricate detailing, and timeless elegance.
          </p>

          <p>
            Our Heritage Collection is a tribute to these enduring traditions, bringing together authentic weaves that
            honor the beauty and character of handcrafted excellence.
          </p>

          <p>
            We are committed to offering authentic handloom sarees at exceptional value, making timeless craftsmanship
            accessible for life&apos;s most cherished celebrations, meaningful occasions, and memorable moments.
          </p>

          <blockquote className="border-l-4 border-[#C2185B] pl-4 italic text-[#4E1E24] mt-8">
            “Every thread reflects dedication. Every weave preserves tradition. Every saree tells a story.”
          </blockquote>
        </div>
      </div>
    </div>
  )
}
