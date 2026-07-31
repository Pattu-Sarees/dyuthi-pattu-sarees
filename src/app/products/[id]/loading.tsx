export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6 bg-[#FFFDF7] grid md:grid-cols-2 gap-8" aria-busy="true" aria-label="Loading product">
      <div className="aspect-square bg-black/5 rounded-lg animate-pulse" />
      <div className="space-y-4">
        <div className="h-7 w-3/4 bg-black/5 rounded animate-pulse" />
        <div className="h-6 w-1/3 bg-black/5 rounded animate-pulse" />
        <div className="h-4 w-full bg-black/5 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-black/5 rounded animate-pulse" />
        <div className="h-11 w-40 bg-black/5 rounded-lg animate-pulse mt-6" />
      </div>
    </div>
  )
}
