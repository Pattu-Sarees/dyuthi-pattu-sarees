export const metadata = { title: 'Order Lifecycle | Admin' }

const STEPS = [
  ['Pending', 'Order received, not yet confirmed.'],
  ['Pre-booking', 'Reserved for an item not currently in stock (e.g. restock in ~45 days).'],
  ['Confirmed', 'Order accepted and being prepared.'],
  ['Packed', 'Items packed and ready to ship.'],
  ['Shipped', 'Handed to the courier / on the way.'],
  ['Delivered', 'Received by the customer — stock is auto-decremented and revenue is counted.'],
  ['Cancelled', 'Order cancelled — excluded from revenue.'],
]

export default function OrderLifecyclePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-4" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Order Lifecycle</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <ol className="space-y-3">
          {STEPS.map(([s, d], i) => (
            <li key={s} className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-[#F4E5C2] text-[#4E1E24] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm"><strong className="text-[#4E1E24]">{s}</strong> — <span className="text-gray-600">{d}</span></span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-400 mt-4">Revenue counts only <strong>Delivered</strong> orders; <strong>Cancelled</strong> orders are excluded. Marking an order Delivered also reduces the purchased colour’s stock.</p>
      </div>
    </div>
  )
}
