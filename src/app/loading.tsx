// Instant navigation feedback: shown the moment a link is clicked while the
// (dynamic) server page fetches its data. Header/footer persist in the layout.
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#FFFDF7]" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-9 rounded-full border-2 border-rose-200 border-t-[#C2185B] animate-spin" />
      <p className="text-sm text-[#71474D]">Loading…</p>
    </div>
  )
}
