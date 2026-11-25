import { supabase } from './supabaseClient'

/** Permanently deletes the signed-in user and all their data (see migration 0003). */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account')
  if (error) throw error
}
