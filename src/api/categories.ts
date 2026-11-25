import type { Category } from '../core'
import { supabase } from './supabaseClient'

export type CategoryInput = Pick<Category, 'name' | 'color' | 'icon'> & Partial<Pick<Category, 'sort_order' | 'archived_at'>>

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('created_at')
  if (error) throw error
  return data
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}
