// Wishlist collections — all reads/writes go through the server /api routes
// (which enforce ownership with the service role). The browser no longer hits
// the Supabase REST endpoint for these, so direct REST writes can be removed.

export interface Collection {
  id: string
  user_id: string
  name: string
  items: string[]
  cover: string | null
  created_at: string
  updated_at: string
}

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || 'Request failed')
  return json as T
}

// All collections for the current user.
export async function fetchCollections(): Promise<Collection[]> {
  const { collections } = await api<{ collections: Collection[] }>('/api/wishlist/collections')
  return collections || []
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createCollection(_userId: string, name: string, items: string[], cover: string | null): Promise<Collection> {
  const { collection } = await api<{ collection: Collection }>('/api/wishlist/collections', {
    method: 'POST',
    body: JSON.stringify({ name, items, cover }),
  })
  return collection
}

// Merge new item keys into a collection (dedupes) — merge is done client-side,
// the server persists the resulting list on the user's own collection.
export async function addItemsToCollection(collection: Collection, keys: string[]): Promise<Collection> {
  const merged = Array.from(new Set([...(collection.items || []), ...keys]))
  const { collection: updated } = await api<{ collection: Collection }>('/api/wishlist/collections', {
    method: 'PATCH',
    body: JSON.stringify({ id: collection.id, items: merged }),
  })
  return updated
}

export async function renameCollection(id: string, name: string): Promise<void> {
  await api('/api/wishlist/collections', { method: 'PATCH', body: JSON.stringify({ id, name }) })
}

export async function deleteCollection(id: string): Promise<void> {
  await api(`/api/wishlist/collections?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}
