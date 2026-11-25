import { describe, expect, it } from 'vitest'
import { addDays, dateRange, endOfMonth, toDateKey, weekdayOf } from './dates'
import { completionKey, describeRecurrence, isScheduledOn, overdueTasks, sortTasks } from './schedule'
import { bestStreak, overallStreak, taskStreak } from './streaks'
import type { Task } from './types'

let seq = 0
function task(p: Partial<Task>): Task {
  return {
    id: p.id ?? `t${++seq}`,
    user_id: 'u',
    category_id: null,
    title: 'Task',
    notes: null,
    priority: 'medium',
    due_time: null,
    recurrence: 'daily',
    days_of_week: [],
    date: null,
    start_date: '2026-11-01',
    archived_at: null,
    sort_order: 0,
    created_at: '2026-11-01T00:00:00Z',
    ...p,
  }
}
const doneSet = (...pairs: [string, string][]) => new Set(pairs.map(([t, d]) => completionKey(t, d)))

describe('dates', () => {
  it('does day arithmetic across month/year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29')
    expect(dateRange('2026-11-29', '2026-12-02')).toHaveLength(4)
  })
  it('knows weekdays', () => {
    expect(weekdayOf('2026-11-25')).toBe(3) // Wednesday
  })
  it('converts instants to local days by timezone', () => {
    const instant = '2026-11-25T20:00:00Z'
    expect(toDateKey(instant, 'UTC')).toBe('2026-11-25')
    expect(toDateKey(instant, 'Asia/Jakarta')).toBe('2026-11-26') // UTC+7
    expect(toDateKey(instant, 'America/Los_Angeles')).toBe('2026-11-25')
  })
})

describe('schedule', () => {
  it('handles once / daily / weekly', () => {
    const once = task({ recurrence: 'once', date: '2026-11-25' })
    expect(isScheduledOn(once, '2026-11-25')).toBe(true)
    expect(isScheduledOn(once, '2026-11-26')).toBe(false)

    const daily = task({ start_date: '2026-11-10' })
    expect(isScheduledOn(daily, '2026-11-09')).toBe(false)
    expect(isScheduledOn(daily, '2026-11-10')).toBe(true)

    const weekdays = task({ recurrence: 'weekly', days_of_week: [1, 2, 3, 4, 5] })
    expect(isScheduledOn(weekdays, '2026-11-25')).toBe(true) // Wed
    expect(isScheduledOn(weekdays, '2026-11-28')).toBe(false) // Sat
  })
  it('stops scheduling archived tasks from the archive day on', () => {
    const t = task({ archived_at: '2026-11-20T10:00:00Z' })
    expect(isScheduledOn(t, '2026-11-19')).toBe(true)
    expect(isScheduledOn(t, '2026-11-20')).toBe(false)
  })
  it('finds overdue one-offs', () => {
    const a = task({ id: 'a', recurrence: 'once', date: '2026-11-20' })
    const b = task({ id: 'b', recurrence: 'once', date: '2026-11-21' })
    const c = task({ id: 'c', recurrence: 'once', date: '2026-11-25' })
    const overdue = overdueTasks([a, b, c, task({})], doneSet(['b', '2026-11-21']), '2026-11-25')
    expect(overdue.map((t) => t.id)).toEqual(['a'])
  })
  it('sorts undone → priority → due time', () => {
    const list = [
      task({ id: 'low', priority: 'low' }),
      task({ id: 'done-high', priority: 'high' }),
      task({ id: 'high-late', priority: 'high', due_time: '18:00' }),
      task({ id: 'high-early', priority: 'high', due_time: '08:00' }),
    ]
    const sorted = sortTasks(list, (t) => t.id === 'done-high').map((t) => t.id)
    expect(sorted).toEqual(['high-early', 'high-late', 'low', 'done-high'])
  })
  it('describes recurrence', () => {
    expect(describeRecurrence({ recurrence: 'weekly', days_of_week: [5, 1, 2, 3, 4] })).toBe('Weekdays')
    expect(describeRecurrence({ recurrence: 'weekly', days_of_week: [1, 3] })).toBe('Mon, Wed')
  })
})

describe('streaks', () => {
  const today = '2026-11-25'
  it('counts a task streak, not breaking on an unfinished today', () => {
    const t = task({ id: 'x', start_date: '2026-11-20' })
    const done = doneSet(['x', '2026-11-22'], ['x', '2026-11-23'], ['x', '2026-11-24'])
    expect(taskStreak(t, done, today)).toBe(3)
    done.add(completionKey('x', today))
    expect(taskStreak(t, done, today)).toBe(4)
  })
  it('skips unscheduled days for weekly tasks', () => {
    // Mon/Wed task: Mon 23 and Wed 25 done, Wed 18 + Mon 16 done, but Fri 20 not scheduled
    const t = task({ id: 'w', recurrence: 'weekly', days_of_week: [1, 3], start_date: '2026-11-16' })
    const done = doneSet(['w', '2026-11-16'], ['w', '2026-11-18'], ['w', '2026-11-23'], ['w', '2026-11-25'])
    expect(taskStreak(t, done, today)).toBe(4)
  })
  it('computes overall perfect-day streak and best streak', () => {
    const a = task({ id: 'a', start_date: '2026-11-20' })
    const b = task({ id: 'b', recurrence: 'once', date: '2026-11-23' })
    const done = doneSet(
      ['a', '2026-11-20'],
      // 21 missed
      ['a', '2026-11-22'],
      ['a', '2026-11-23'],
      ['b', '2026-11-23'],
      ['a', '2026-11-24'],
    )
    expect(overallStreak([a, b], done, today)).toBe(3) // 22, 23, 24 (today pending)
    done.delete(completionKey('b', '2026-11-23'))
    expect(overallStreak([a, b], done, today)).toBe(1) // only 24
    expect(bestStreak([a, b], done, '2026-11-01', today)).toBe(1)
  })
})
