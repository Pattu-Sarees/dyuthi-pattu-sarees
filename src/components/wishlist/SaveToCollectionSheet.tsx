'use client'

import Image from 'next/image'
import { Plus, ChevronRight } from 'lucide-react'
import type { Collection } from '@/lib/collections'

export default function SaveToCollectionSheet({
  collections,
  onCreateNew,
  onSelect,
  onClose,
}: {
  collections: Collection[]
  onCreateNew: () => void
  onSelect: (c: Collection) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-label="Save items to collection">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#4E1E24] text-lg">Save items to</h2>
        </div>

        <div className="overflow-y-auto">
          {/* Create new collection */}
          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <span className="h-12 w-12 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-[#4E1E24]" />
            </span>
            <span className="font-medium text-[#4E1E24]">Create new collection</span>
          </button>

          {/* Existing collections */}
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
            >
              <span className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                {c.cover ? <Image src={c.cover} alt="" fill className="object-cover" sizes="48px" /> : null}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-[#4E1E24] truncate">{c.name}</span>
                <span className="block text-sm text-gray-500">{c.items.length} Item{c.items.length === 1 ? '' : 's'}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
