export const metadata = { title: 'Inventory Guide | Admin' }

export default function InventoryGuidePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-[#4E1E24] mb-4" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Inventory Guide</h1>
      <div className="space-y-4 text-sm text-gray-700 bg-white rounded-xl border border-gray-100 p-5">
        <p><strong>Products vs Inventory.</strong> Create and edit saree details (name, price, photos) in <em>Products</em>. Manage how many pieces you have — per colour — in <em>Inventory</em>, so every stock change is logged.</p>
        <p><strong>Per-colour stock.</strong> Each product photo is a colour/item with its own quantity. The product total = the sum of all colour quantities.</p>
        <p><strong>Adjusting stock.</strong> On the Inventory page click <em>Adjust</em>, pick a colour, then Add / Remove / Set-to. Every change records a reason and appears in the colour’s history.</p>
        <p><strong>Statuses.</strong> A colour is <span className="text-green-600 font-medium">In</span> when it has stock, <span className="text-orange-600 font-medium">Low</span> at 3 or fewer, and <span className="text-red-600 font-medium">Out</span> at 0. Filter chips at the top show each group.</p>
        <p><strong>Auto-decrement.</strong> When an order is marked <em>Delivered</em>, the exact colour the customer bought is reduced automatically and a low-stock notification is raised if it runs low.</p>
      </div>
    </div>
  )
}
