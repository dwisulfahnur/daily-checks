import { format } from 'date-fns'
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Flame, Target, Trophy, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  bestStreak,
  completionKey,
  dateRange,
  dayStats,
  isScheduledOn,
  endOfMonth,
  keyToDisplayDate,
  overallStreak,
  startOfMonth,
  taskStreak,
  tasksForDate,
  todayKey,
  weekdayOf,
  WEEKDAY_LABELS,
  type DateKey,
} from '../core'
import { useCategories, useCompletions, useTasks, useTimezone } from '../hooks/data'

/** Heatmap color by completion ratio. */
function cellClass(scheduled: number, done: number, future: boolean): string {
  if (future || scheduled === 0) return 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
  const r = done / scheduled
  if (r === 1) return 'bg-emerald-500 text-white'
  if (r >= 0.66) return 'bg-emerald-300 text-emerald-950 dark:bg-emerald-700 dark:text-white'
  if (r >= 0.33) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100'
  if (r > 0) return 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
}

const LEGEND = ['bg-slate-100 dark:bg-slate-800', 'bg-amber-100 dark:bg-amber-900/50', 'bg-emerald-100 dark:bg-emerald-900/70', 'bg-emerald-300 dark:bg-emerald-700', 'bg-emerald-500']

export default function History() {
  const tz = useTimezone()
  const today = todayKey(tz)
  const [month, setMonth] = useState(startOfMonth(today))
  const [selected, setSelected] = useState<DateKey>(today)

  const { data: tasks = [], isLoading } = useTasks()
  const { data: categories = [] } = useCategories()
  const { done } = useCompletions()
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const stats = useMemo(() => {
    const current = overallStreak(tasks, done, today, tz)
    const best = bestStreak(tasks, done, addDays(today, -365), today, tz)
    const last30 = dateRange(addDays(today, -29), today).map((d) => dayStats(tasks, done, d, tz))
    const sched = last30.reduce((a, s) => a + s.scheduled, 0)
    const fin = last30.reduce((a, s) => a + s.done, 0)
    return { current, best: Math.max(best, current), rate30: sched ? Math.round((fin / sched) * 100) : 0 }
  }, [tasks, done, today, tz])

  const routines = useMemo(
    () =>
      tasks
        .filter((t) => t.recurrence !== 'once' && !t.archived_at)
        .map((t) => ({
          task: t,
          streak: taskStreak(t, done, today, tz),
          recent: dateRange(addDays(today, -13), today).map((d) =>
            !isScheduledOn(t, d, tz) ? 'off' : done.has(completionKey(t.id, d)) ? 'done' : d === today ? 'pending' : 'missed',
          ),
        }))
        .sort((a, b) => b.streak - a.streak),
    [tasks, done, today, tz],
  )

  const days = dateRange(month, endOfMonth(month))
  const leadingBlanks = weekdayOf(month)
  const selectedTasks = tasksForDate(tasks, selected, tz)

  if (isLoading)
    return (
      <div className="space-y-4 motion-safe:animate-pulse" aria-busy="true">
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="card h-24" />)}</div>
        <div className="card h-80" />
      </div>
    )

  const selectedDone = selectedTasks.filter((t) => done.has(completionKey(t.id, selected))).length

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-2xl font-bold tracking-tight">History</h1>

      {/* Streak cards */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="size-4" />} tone="text-orange-500 bg-orange-50 dark:bg-orange-500/10" label="Current streak" value={stats.current} unit={stats.current === 1 ? 'day' : 'days'} />
        <Stat icon={<Trophy className="size-4" />} tone="text-amber-500 bg-amber-50 dark:bg-amber-500/10" label="Best streak" value={stats.best} unit={stats.best === 1 ? 'day' : 'days'} />
        <Stat icon={<Target className="size-4" />} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" label="Last 30 days" value={stats.rate30} unit="%" />
      </div>

      {/* Calendar heatmap */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[15px] font-semibold">{format(keyToDisplayDate(month), 'MMMM yyyy')}</span>
          <div className="flex gap-1">
            <button className="icon-btn size-8" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month"><ChevronLeft className="size-4" /></button>
            <button className="icon-btn size-8" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {WEEKDAY_LABELS.map((l) => (
            <div key={l} className="pb-1 text-[11px] font-medium text-slate-400 uppercase">{l.slice(0, 2)}</div>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => <div key={`b${i}`} />)}
          {days.map((d) => {
            const s = dayStats(tasks, done, d, tz)
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                title={`${s.done}/${s.scheduled} done`}
                aria-label={`${format(keyToDisplayDate(d), 'd MMMM')}: ${s.done} of ${s.scheduled} done`}
                aria-pressed={d === selected}
                className={`relative aspect-square rounded-lg text-xs font-medium tabular-nums transition hover:scale-105 ${cellClass(s.scheduled, s.done, d > today)} ${
                  d === selected ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-indigo-400 dark:ring-offset-slate-900' : ''
                }`}
              >
                {Number(d.slice(8))}
                {d === today && <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-slate-400">
          Less
          {LEGEND.map((c) => <span key={c} className={`size-3 rounded ${c}`} />)}
          More
        </div>
      </section>

      {/* Selected day detail */}
      <section className="card overflow-hidden">
        <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2">
          <h3 className="text-[15px] font-semibold">{format(keyToDisplayDate(selected), 'EEEE, d MMMM')}</h3>
          {selectedTasks.length > 0 && <span className="text-xs text-slate-500 tabular-nums">{selectedDone}/{selectedTasks.length} done</span>}
        </div>
        {selectedTasks.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Nothing was scheduled.</p>
        ) : (
          <ul className="pb-2 text-sm">
            {selectedTasks.map((t) => {
              const ok = done.has(completionKey(t.id, selected))
              const cat = t.category_id ? catById.get(t.category_id) : undefined
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2">
                  {ok ? (
                    <CheckCircle2 className="size-[18px] shrink-0 text-emerald-500" aria-label="Done" />
                  ) : selected >= today ? (
                    <Circle className="size-[18px] shrink-0 text-slate-300 dark:text-slate-600" aria-label="Pending" />
                  ) : (
                    <XCircle className="size-[18px] shrink-0 text-slate-300 dark:text-slate-600" aria-label="Missed" />
                  )}
                  <span className={`truncate ${ok ? '' : 'text-slate-500 dark:text-slate-400'}`}>{t.title}</span>
                  {cat && (
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                      <span className="size-2 rounded-full" style={{ background: cat.color }} /> {cat.name}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Per-routine streaks */}
      {routines.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2">
            <h3 className="text-[15px] font-semibold">Routines</h3>
            <span className="text-xs text-slate-400">last 14 days</span>
          </div>
          <ul className="pb-2 text-sm">
            {routines.map(({ task, streak, recent }) => (
              <li key={task.id} className="flex items-center gap-3 px-4 py-2">
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                <span className="hidden gap-0.5 min-[400px]:flex" aria-hidden="true">
                  {recent.map((r, i) => (
                    <span
                      key={i}
                      className={`h-3.5 w-1.5 rounded-full ${
                        r === 'done' ? 'bg-emerald-500' : r === 'missed' ? 'bg-slate-200 dark:bg-slate-700' : r === 'pending' ? 'bg-slate-200 ring-1 ring-indigo-400 dark:bg-slate-700' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </span>
                <span className={`inline-flex w-10 items-center justify-end gap-0.5 tabular-nums ${streak ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                  <Flame className="size-3.5" /> {streak}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ icon, tone, label, value, unit }: { icon: React.ReactNode; tone: string; label: string; value: number; unit: string }) {
  return (
    <div className="card p-3.5">
      <div className={`mb-2 grid size-7 place-items-center rounded-lg ${tone}`}>{icon}</div>
      <div className="text-2xl font-bold tracking-tight tabular-nums">
        {value}
        <span className="ml-0.5 text-xs font-medium text-slate-400">{unit}</span>
      </div>
      <div className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}
