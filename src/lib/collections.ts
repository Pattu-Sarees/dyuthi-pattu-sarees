import { createClient } from '@/lib/supabase/client'

export interface Collection {
  id: string
  user_id: string
  name: string
  items: string[]
  cover: string | null
  created_at: string
  updated_at: string
}

// All collections for the current user (RLS scopes to auth.uid()).
export async function fetchCollections(): Promise<Collection[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wishlist_collections')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Collection[]) || []
}

export async function createCollection(userId: string, name: string, items: string[], cover: string | null): Promise<Collection> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wishlist_collections')
    .insert({ user_id: userId, name, items, cover })
    .select('*')
    .single()
  if (error) throw error
  return data as Collection
}

// Merge new item keys into a collection (dedupes).
export async function addItemsToCollection(collection: Collection, keys: string[]): Promise<Collection> {
  const supabase = createClient()
  const merged = Array.from(new Set([...(collection.items || []), ...keys]))
  const { data, error } = await supabase
    .from('wishlist_collections')
    .update({ items: merged })
    .eq('id', collection.id)
    .select('*')
    .single()
  if (error) throw error
  return data as Collection
}

export async function renameCollection(id: string, name: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('wishlist_collections').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteCollection(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('wishlist_collections').delete().eq('id', id)
  if (error) throw error
}
