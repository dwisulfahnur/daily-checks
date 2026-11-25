import { addDays } from './dates'
import { completionKey, isScheduledOn } from './schedule'
import type { DateKey, Task } from './types'

export interface DayStats {
  date: DateKey
  scheduled: number
  done: number
}

export function dayStats(tasks: Task[], done: Set<string>, day: DateKey, timeZone = 'UTC'): DayStats {
  let scheduled = 0
  let doneCount = 0
  for (const t of tasks) {
    if (!isScheduledOn(t, day, timeZone)) continue
    scheduled++
    if (done.has(completionKey(t.id, day))) doneCount++
  }
  return { date: day, scheduled, done: doneCount }
}

/** Earliest day any task could have applied — used to bound backward walks. */
function earliestDay(tasks: Task[]): DateKey | null {
  let min: DateKey | null = null
  for (const t of tasks) {
    const d = t.recurrence === 'once' ? t.date : t.start_date
    if (d && (!min || d < min)) min = d
  }
  return min
}

const MAX_DAYS = 3660

/**
 * Consecutive scheduled days (ending today) on which this task was completed.
 * Today counts if done, but an unfinished today doesn't break the streak yet.
 */
export function taskStreak(task: Task, done: Set<string>, today: DateKey, timeZone = 'UTC'): number {
  const first = task.recurrence === 'once' ? task.date : task.start_date
  if (!first) return 0
  let streak = 0
  for (let i = 0, day = today; i < MAX_DAYS && day >= first; i++, day = addDays(day, -1)) {
    if (!isScheduledOn(task, day, timeZone)) continue
    if (done.has(completionKey(task.id, day))) streak++
    else if (day !== today) break
  }
  return streak
}

/**
 * Consecutive "perfect" days (every scheduled task done), ending today.
 * Days with nothing scheduled are skipped; an unfinished today doesn't break it.
 */
export function overallStreak(tasks: Task[], done: Set<string>, today: DateKey, timeZone = 'UTC'): number {
  const first = earliestDay(tasks)
  if (!first) return 0
  let streak = 0
  for (let i = 0, day = today; i < MAX_DAYS && day >= first; i++, day = addDays(day, -1)) {
    const s = dayStats(tasks, done, day, timeZone)
    if (s.scheduled === 0) continue
    if (s.done === s.scheduled) streak++
    else if (day !== today) break
  }
  return streak
}

/** Longest run of perfect days between `from` and `to` (inclusive). */
export function bestStreak(tasks: Task[], done: Set<string>, from: DateKey, to: DateKey, timeZone = 'UTC'): number {
  let best = 0
  let run = 0
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const s = dayStats(tasks, done, day, timeZone)
    if (s.scheduled === 0) continue
    if (s.done === s.scheduled) best = Math.max(best, ++run)
    else run = 0
  }
  return best
}
