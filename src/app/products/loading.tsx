export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6 bg-[#FFFDF7]" aria-busy="true" aria-label="Loading products">
      <div className="h-5 w-32 bg-black/5 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="aspect-[9/10] bg-black/5 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 bg-black/5 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-black/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
