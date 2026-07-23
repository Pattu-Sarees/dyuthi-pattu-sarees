'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Loader2 } from 'lucide-react'

const SUGGESTIONS = ['Home Wear 🏠', 'Office Wear 💼', 'Summer Wear ⛱️', 'Upcoming Sale 🏷️']

export default function CreateCollectionModal({
  previewImages,
  onCreate,
  onClose,
}: {
  previewImages: string[]
  onCreate: (name: string) => Promise<void> | void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onCreate(trimmed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center" role="dialog" aria-label="Create new collection">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-[#4E1E24] text-lg">Create New Collection</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5 text-[#4E1E24]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected-item preview strip */}
        {previewImages.length > 0 && (
          <div className="bg-gray-100 px-5 py-4 flex gap-3 overflow-x-auto">
            {previewImages.slice(0, 8).map((img, i) => (
              <div key={i} className="relative h-24 w-20 flex-shrink-0 rounded-md overflow-hidden bg-white">
                {img ? <Image src={img} alt="" fill className="object-cover" sizes="80px" /> : null}
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <label className="block text-sm font-semibold text-[#4E1E24] mb-2">
            Collection Name <span className="text-[#AD1457]">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Enter Collection Name *"
            maxLength={40}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] focus:border-[#AD1457]"
          />

          <p className="text-sm text-gray-500 mt-5 mb-2">Suggested names:</p>
          <div className="space-y-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setName(s)}
                className="block w-full text-left py-2.5 text-[#4E1E24] font-medium hover:text-[#AD1457] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Create button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Collection
          </button>
        </div>
      </div>
    </div>
  )
}
