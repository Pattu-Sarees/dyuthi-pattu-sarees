'use client'

import { useEffect, useState } from 'react'
import { X, Plus, Pencil, Trash2, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { MENU_GROUPS, type ProductCategory } from '@/lib/categories'

type Cat = ProductCategory & { id: string }

export default function CategoryManager({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Add form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [group, setGroup] = useState<string>('Sarees')

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [eName, setEName] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eGroup, setEGroup] = useState('Sarees')

  const load = () => {
    setLoading(true)
    fetch('/api/admin/product-categories')
      .then((r) => r.json())
      .then(({ categories }) => setCats(categories || []))
      .catch(() => toast.error('Could not load categories'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const notifyChanged = () => onChanged?.()

  const add = async () => {
    if (!name.trim()) return toast.error('Enter a category name')
    setSaving(true)
    const res = await fetch('/api/admin/product-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, menu_group: group }),
    })
    setSaving(false)
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || 'Could not add category')
    toast.success(`Added "${name.trim()}"`)
    setName(''); setDescription(''); setGroup('Sarees')
    load(); notifyChanged()
  }

  const startEdit = (c: Cat) => {
    setEditId(c.id); setEName(c.name); setEDesc(c.description || ''); setEGroup(c.menu_group)
  }

  const saveEdit = async (id: string) => {
    if (!eName.trim()) return toast.error('Enter a category name')
    setSaving(true)
    const res = await fetch(`/api/admin/product-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: eName, description: eDesc, menu_group: eGroup }),
    })
    setSaving(false)
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || 'Could not update category')
    toast.success('Category updated')
    setEditId(null)
    load(); notifyChanged()
  }

  const remove = async (c: Cat) => {
    if (!confirm(`Delete category "${c.name}"?`)) return
    const res = await fetch(`/api/admin/product-categories/${c.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error || 'Could not delete category')
    toast.success(`Deleted "${c.name}"`)
    load(); notifyChanged()
  }

  const input = 'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#AD1457] bg-white'
  const label = 'block text-xs font-semibold text-gray-600 mb-1'

  // Group for display (alphabetical within each group).
  const grouped = MENU_GROUPS.map((g) => ({
    group: g,
    items: cats.filter((c) => c.menu_group === g).sort((a, b) => a.name.localeCompare(b.name)),
  }))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-label="Manage categories">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#4E1E24]">Manage Categories</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5 text-gray-500"><X className="h-5 w-5" /></button>
        </div>

        {/* Add form */}
        <div className="px-5 py-4 border-b border-gray-100 bg-[#FFFDF7]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Banarasi Silk" />
            </div>
            <div>
              <label className={label}>Menu group</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)} className={input}>
                {MENU_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className={label}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${input} h-auto py-2 resize-y`} placeholder="Optional short description" />
          </div>
          <button onClick={add} disabled={saving} className="mt-3 inline-flex items-center gap-1.5 bg-[#AD1457] hover:bg-[#880E4F] disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Category
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#AD1457]" /></div>
          ) : cats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No categories yet. Add one above.</p>
          ) : (
            <div className="space-y-5">
              {grouped.map(({ group: g, items }) => items.length > 0 && (
                <div key={g}>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{g}</p>
                  <div className="space-y-1.5">
                    {items.map((c) => (
                      <div key={c.id} className="rounded-lg border border-gray-100 px-3 py-2">
                        {editId === c.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input value={eName} onChange={(e) => setEName(e.target.value)} className={input} placeholder="Name" />
                              <select value={eGroup} onChange={(e) => setEGroup(e.target.value)} className={input}>
                                {MENU_GROUPS.map((mg) => <option key={mg} value={mg}>{mg}</option>)}
                              </select>
                            </div>
                            <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={2} className={`${input} h-auto py-2 resize-y`} placeholder="Description" />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(c.id)} disabled={saving} className="inline-flex items-center gap-1 bg-[#AD1457] hover:bg-[#880E4F] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-md">
                                <Check className="h-3.5 w-3.5" /> Save
                              </button>
                              <button onClick={() => setEditId(null)} className="text-xs font-semibold text-gray-500 px-3 py-1.5">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                              {c.description && <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>}
                            </div>
                            <button onClick={() => startEdit(c)} aria-label="Edit" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#AD1457]"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => remove(c)} aria-label="Delete" className="p-1.5 rounded-md text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
