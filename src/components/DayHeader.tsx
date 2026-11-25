import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import { addDays, dateRange, keyToDisplayDate, weekdayOf, type DateKey, type DayStats } from '../core'
import ProgressRing from './ProgressRing'

interface Props {
  date: DateKey
  today: DateKey
  onChange: (d: DateKey) => void
  done: number
  total: number
  /** Completion stats for any day, used for the dots under the week strip. */
  statsFor: (d: DateKey) => DayStats
}

/** Day title + progress ring + a swipeable-feeling week strip. */
export default function DayHeader({ date, today, onChange, done, total, statsFor }: Props) {
  const label =
    date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : date === addDays(today, 1) ? 'Tomorrow' : format(keyToDisplayDate(date), 'EEEE')
  const weekStart = addDays(date, -weekdayOf(date))
  const week = dateRange(weekStart, addDays(weekStart, 6))
  const pct = total ? done / total : 0
  const allDone = total > 0 && done === total

  return (
    <section className="card p-4">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{format(keyToDisplayDate(date), 'EEEE, d MMMM yyyy')}</div>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{label}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              'Nothing scheduled'
            ) : allDone ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <PartyPopper className="size-4" /> All done. Nice work!
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-900 dark:text-white">{done}</span> of {total} done · {total - done} left
              </>
            )}
          </p>
        </div>
        <ProgressRing value={pct} size={68} stroke={7}>
          <span className="text-sm font-semibold tabular-nums">{Math.round(pct * 100)}%</span>
        </ProgressRing>
      </div>

      <div className="mt-4 flex items-center gap-1">
        <button className="icon-btn size-8 shrink-0" onClick={() => onChange(addDays(date, -7))} aria-label="Previous week">
          <ChevronLeft className="size-4" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {week.map((d) => {
            const s = statsFor(d)
            const selected = d === date
            const isToday = d === today
            const dot =
              d > today || s.scheduled === 0
                ? 'bg-transparent'
                : s.done === s.scheduled
                  ? 'bg-emerald-500'
                  : s.done > 0
                    ? 'bg-amber-400'
                    : d < today
                      ? 'bg-slate-300 dark:bg-slate-600'
                      : 'bg-transparent'
            return (
              <button
                key={d}
                onClick={() => onChange(d)}
                aria-label={format(keyToDisplayDate(d), 'EEEE d MMMM')}
                aria-current={selected ? 'date' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                  selected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : isToday
                      ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-[10px] font-medium uppercase ${selected ? 'text-indigo-100' : 'opacity-60'}`}>{format(keyToDisplayDate(d), 'EEEEE')}</span>
                <span className="text-sm font-semibold tabular-nums">{Number(d.slice(8))}</span>
                <span className={`size-1 rounded-full ${selected && dot !== 'bg-transparent' ? 'bg-white' : dot}`} />
              </button>
            )
          })}
        </div>
        <button className="icon-btn size-8 shrink-0" onClick={() => onChange(addDays(date, 7))} aria-label="Next week">
          <ChevronRight className="size-4" />
        </button>
      </div>
      {date !== today && (
        <button className="btn-ghost mx-auto mt-2 flex px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400" onClick={() => onChange(today)}>
          Back to today
        </button>
      )}
    </section>
  )
}
