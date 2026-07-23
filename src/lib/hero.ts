// Editable hero slides, stored in the `hero` homepage_sections row's `data.slides`.
// Each slide is one background image with its own heading + description.
// Defaults mirror the original hardcoded carousel so the storefront is unchanged
// until an admin edits the slides.

export type HeroSlide = {
  image: string
  heading: string
  description: string
}

const SHARED_HEADING = 'Treasures from Timeless Traditions'
const SHARED_DESC =
  "Discover authentic handloom sarees born from generations of artistry — where every weave reflects India's rich cultural heritage."

export const HERO_DEFAULT_SLIDES: HeroSlide[] = [
  '/hero/hero-1.png',
  '/hero/hero-2.png',
  '/hero/hero-3.png',
  '/hero/hero-4.png',
  '/hero/hero-5.png',
].map((image) => ({ image, heading: SHARED_HEADING, description: SHARED_DESC }))

// Read slides from a stored `data` blob, keeping only entries that have an image.
// Falls back to the defaults when nothing valid is stored.
export function resolveHeroSlides(data?: Record<string, unknown> | null): HeroSlide[] {
  const raw = (data?.slides as unknown[]) || []
  const slides = raw
    .map((s) => {
      const o = (s || {}) as Partial<HeroSlide>
      return {
        image: typeof o.image === 'string' ? o.image.trim() : '',
        heading: typeof o.heading === 'string' ? o.heading : '',
        description: typeof o.description === 'string' ? o.description : '',
      }
    })
    .filter((s) => s.image)
  return slides.length ? slides : HERO_DEFAULT_SLIDES
}
