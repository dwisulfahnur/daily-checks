// Pure domain types — no React/DOM/Supabase imports so this folder can be
// shared with a future React Native app.

/** A calendar day in the user's timezone, formatted `yyyy-MM-dd`. */
export type DateKey = string

export type Priority = 'low' | 'medium' | 'high'
export type Recurrence = 'once' | 'daily' | 'weekly'

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  sort_order: number
  archived_at: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  notes: string | null
  priority: Priority
  /** `HH:mm` or `HH:mm:ss`, or null when there is no due time. */
  due_time: string | null
  recurrence: Recurrence
  /** 0 = Sunday … 6 = Saturday. Used when recurrence is `weekly`. */
  days_of_week: number[]
  /** The day for a `once` task. */
  date: DateKey | null
  /** First day a recurring task applies. */
  start_date: DateKey
  archived_at: string | null
  sort_order: number
  created_at: string
}

export interface Completion {
  id: string
  user_id: string
  task_id: string
  date: DateKey
  completed_at: string
}

export interface Profile {
  id: string
  timezone: string
}

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
