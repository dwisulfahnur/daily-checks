import { toDateKey, weekdayOf } from './dates'
import { PRIORITY_RANK, type Completion, type DateKey, type Task } from './types'

/** Day (in the user's timezone) from which an archived task stops applying. */
function archivedFrom(task: Task, timeZone: string): DateKey | null {
  return task.archived_at ? toDateKey(task.archived_at, timeZone) : null
}

/** Is this task on the checklist for the given day? */
export function isScheduledOn(task: Task, day: DateKey, timeZone = 'UTC'): boolean {
  const archived = archivedFrom(task, timeZone)
  if (archived && day >= archived) return false

  switch (task.recurrence) {
    case 'once':
      return task.date === day
    case 'daily':
      return day >= task.start_date
    case 'weekly':
      return day >= task.start_date && task.days_of_week.includes(weekdayOf(day))
  }
}

export function tasksForDate(tasks: Task[], day: DateKey, timeZone = 'UTC'): Task[] {
  return tasks.filter((t) => isScheduledOn(t, day, timeZone))
}

/** Key used for fast completion lookups. */
export const completionKey = (taskId: string, day: DateKey) => `${taskId}|${day}`

export function completionSet(completions: Completion[]): Set<string> {
  return new Set(completions.map((c) => completionKey(c.task_id, c.date)))
}

/** One-off tasks from before `today` that were never completed. */
export function overdueTasks(tasks: Task[], done: Set<string>, today: DateKey): Task[] {
  return tasks
    .filter(
      (t) =>
        t.recurrence === 'once' &&
        !t.archived_at &&
        t.date !== null &&
        t.date < today &&
        !done.has(completionKey(t.id, t.date)),
    )
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))
}

/** Undone first, then priority (high → low), then due time (none last), then manual order. */
export function sortTasks(tasks: Task[], isDone: (t: Task) => boolean): Task[] {
  return [...tasks].sort((a, b) => {
    const doneDiff = Number(isDone(a)) - Number(isDone(b))
    if (doneDiff) return doneDiff
    const pri = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (pri) return pri
    const at = a.due_time ?? '99'
    const bt = b.due_time ?? '99'
    if (at !== bt) return at < bt ? -1 : 1
    return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  })
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function describeRecurrence(task: Pick<Task, 'recurrence' | 'days_of_week'>): string {
  if (task.recurrence === 'once') return 'Once'
  if (task.recurrence === 'daily') return 'Every day'
  const days = [...task.days_of_week].sort()
  if (days.join() === '1,2,3,4,5') return 'Weekdays'
  if (days.join() === '0,6') return 'Weekends'
  return days.map((d) => WEEKDAY_LABELS[d]).join(', ')
}
