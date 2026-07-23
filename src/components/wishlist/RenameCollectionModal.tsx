'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function RenameCollectionModal({
  initialName,
  onSave,
  onClose,
}: {
  initialName: string
  onSave: (name: string) => Promise<void> | void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSave(trimmed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center" role="dialog" aria-label="Rename collection">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#4E1E24] text-lg">Rename Collection</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5 text-[#4E1E24]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">
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
          <button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#AD1457] hover:bg-[#880E4F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
