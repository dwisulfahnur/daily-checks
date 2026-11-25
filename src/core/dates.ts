import type { DateKey } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Returns the `yyyy-MM-dd` day of an instant in the given IANA timezone. */
const dayFormatters = new Map<string, Intl.DateTimeFormat>()

export function toDateKey(instant: Date | string, timeZone: string): DateKey {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  let fmt = dayFormatters.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    dayFormatters.set(timeZone, fmt)
  }
  const parts = fmt.formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  return toDateKey(now, timeZone)
}

/** Current time of day `HH:mm` in the given timezone. */
export function nowTimeIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
}

/** Parse a DateKey into a UTC-midnight Date (timezone-independent arithmetic). */
function keyToUtc(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function utcToKey(d: Date): DateKey {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = keyToUtc(key)
  d.setUTCDate(d.getUTCDate() + n)
  return utcToKey(d)
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key: DateKey): number {
  return keyToUtc(key).getUTCDay()
}

/** Inclusive list of days from `from` to `to`. */
export function dateRange(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = []
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k)
  return out
}

export function startOfMonth(key: DateKey): DateKey {
  return key.slice(0, 8) + '01'
}

export function endOfMonth(key: DateKey): DateKey {
  const d = keyToUtc(startOfMonth(key))
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return utcToKey(d)
}

export function addMonths(key: DateKey, n: number): DateKey {
  const d = keyToUtc(startOfMonth(key))
  d.setUTCMonth(d.getUTCMonth() + n)
  return utcToKey(d)
}

/** A local Date at noon for display formatting (avoids DST edge cases). */
export function keyToDisplayDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Normalise `HH:mm:ss` → `HH:mm`. */
export function shortTime(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}
