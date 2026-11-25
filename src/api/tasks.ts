import type { Task } from '../core'
import { supabase } from './supabaseClient'

export type TaskInput = Pick<
  Task,
  'title' | 'notes' | 'category_id' | 'priority' | 'due_time' | 'recurrence' | 'days_of_week' | 'date' | 'start_date'
>

/** All tasks, including archived ones (needed so history stays accurate). */
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('sort_order').order('created_at')
  if (error) throw error
  return data
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, patch: Partial<TaskInput & Pick<Task, 'archived_at'>>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
