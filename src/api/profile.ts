import type { Profile } from '../core'
import { supabase } from './supabaseClient'

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('id, timezone').maybeSingle()
  if (error) throw error
  return data
}

export async function updateTimezone(id: string, timezone: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ timezone }).eq('id', id)
  if (error) throw error
}
