import type { Completion, DateKey } from '../core'
import { supabase } from './supabaseClient'

const PAGE = 1000 // Supabase's default max rows per request

/** All completions on or after `from`, paging past the per-request row limit. */
export async function listCompletionsSince(from: DateKey): Promise<Completion[]> {
  const all: Completion[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .gte('date', from)
      .order('date')
      .order('id')
      .range(offset, offset + PAGE - 1)
    if (error) throw error
    all.push(...data)
    if (data.length < PAGE) return all
  }
}

export async function addCompletion(taskId: string, date: DateKey): Promise<Completion> {
  const { data, error } = await supabase
    .from('task_completions')
    .upsert({ task_id: taskId, date }, { onConflict: 'task_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeCompletion(taskId: string, date: DateKey): Promise<void> {
  const { error } = await supabase.from('task_completions').delete().eq('task_id', taskId).eq('date', date)
  if (error) throw error
}
