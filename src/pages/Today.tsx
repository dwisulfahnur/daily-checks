import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarDays, Plus, Trash2 } from 'lucide-react'
import DayHeader from '../components/DayHeader'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import {
  completionKey,
  dayStats,
  keyToDisplayDate,
  nowTimeIn,
  overdueTasks,
  shortTime,
  sortTasks,
  taskStreak,
  tasksForDate,
  todayKey,
  type Category,
  type DateKey,
  type Task,
} from '../core'
import { useCategories, useCompletions, useSaveTask, useTasks, useTimezone, useToggleCompletion, useUpdateTask, useDeleteTask } from '../hooks/data'

type FormState = { task?: Task } | null

export default function Today() {
  const tz = useTimezone()
  const today = todayKey(tz)
  const [date, setDate] = useState<DateKey>(today)

  // If the app stays open past midnight, move from "yesterday" to the new today.
  const lastToday = useRef(today)
  useEffect(() => {
    const check = () => {
      const now = todayKey(tz)
      if (now !== lastToday.current) {
        setDate((d) => (d === lastToday.current ? now : d))
        lastToday.current = now
      }
    }
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [tz])
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState<FormState>(null)
  const [quick, setQuick] = useState('')

  const { data: tasks = [], isLoading: tLoading, error: tError } = useTasks()
  const { data: categories = [] } = useCategories()
  const { done, isLoading: cLoading } = useCompletions()
  const toggle = useToggleCompletion()
  const save = useSaveTask()
  const update = useUpdateTask()
  const del = useDeleteTask()

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const activeCats = categories.filter((c) => !c.archived_at)
  const inFilter = (t: Task) => filter === 'all' || t.category_id === filter || (filter === 'none' && !t.category_id)

  const scheduled = tasksForDate(tasks, date, tz)
  const visible = scheduled.filter(inFilter)
  const isDone = (t: Task, d: DateKey = date) => done.has(completionKey(t.id, d))
  const doneCount = visible.filter((t) => isDone(t)).length
  const overdue = date === today ? overdueTasks(tasks, done, today).filter(inFilter) : []
  const nowTime = nowTimeIn(tz)

  // Group by category, in category order; uncategorised last.
  const groups = ([...categories, undefined] as (Category | undefined)[])
    .map((cat) => ({
      cat,
      items: sortTasks(
        visible.filter((t) => (t.category_id ? catById.get(t.category_id) : undefined) === cat),
        (t) => isDone(t),
      ),
    }))
    .filter((g) => g.items.length > 0)

  const quickAdd = async (e: FormEvent) => {
    e.preventDefault()
    const title = quick.trim()
    if (!title) return
    setQuick('')
    await save.mutateAsync({
      input: {
        title,
        notes: null,
        category_id: filter !== 'all' && filter !== 'none' ? filter : (activeCats[0]?.id ?? null),
        priority: 'medium',
        due_time: null,
        recurrence: 'once',
        days_of_week: [],
        date,
        start_date: date,
      },
    })
  }

  if (tError)
    return (
      <div className="card flex items-center gap-2 p-4 text-sm text-red-600 dark:text-red-400">
        <AlertTriangle className="size-4 shrink-0" /> Failed to load: {(tError as Error).message}
      </div>
    )

  const loading = tLoading || cLoading
  const catChips = [{ id: 'all', name: 'All', icon: '', color: '' }, ...activeCats]
  const countIn = (id: string) => (id === 'all' ? scheduled : scheduled.filter((t) => t.category_id === id)).filter((t) => !isDone(t)).length

  return (
    <div className="space-y-4">
      <DayHeader
        date={date}
        today={today}
        onChange={setDate}
        done={doneCount}
        total={visible.length}
        statsFor={(d) => dayStats(tasks.filter(inFilter), done, d, tz)}
      />

      {/* Category filter */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {catChips.map((c) => {
          const active = filter === c.id
          const left = countIn(c.id)
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              aria-pressed={active}
              className={`btn shrink-0 rounded-full py-1.5 pr-2.5 pl-3 text-[13px] ${
                active
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 shadow-xs ring-1 ring-slate-200/80 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-white'
              }`}
            >
              {c.color && <span className="size-2 rounded-full" style={{ background: c.color }} />}
              {c.name}
              {left > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-white/20 dark:bg-slate-900/10' : 'bg-slate-100 dark:bg-slate-800'}`}>{left}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick add */}
      <form onSubmit={quickAdd} className="card flex items-center gap-1 p-1.5 pl-3 focus-within:ring-4 focus-within:ring-indigo-500/15">
        <Plus className="size-5 shrink-0 text-slate-400" />
        <input
          className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-[15px] outline-none placeholder:text-slate-400"
          placeholder={`Add a task for ${date === today ? 'today' : format(keyToDisplayDate(date), 'd MMM')}…`}
          aria-label="Quick add task"
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
        />
        {quick.trim() ? (
          <button className="btn-primary shrink-0 px-3 py-1.5">Add</button>
        ) : (
          <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-indigo-600 dark:text-indigo-400" onClick={() => setForm({})}>
            Details
          </button>
        )}
      </form>

      {/* Overdue one-off tasks */}
      {overdue.length > 0 && (
        <section className="card overflow-hidden ring-1 ring-red-200/70 dark:ring-red-900/60">
          <h3 className="section-title text-red-600 dark:text-red-400">
            <AlertTriangle className="size-3.5" /> Overdue
            <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 font-semibold normal-case tabular-nums dark:bg-red-950">{overdue.length}</span>
          </h3>
          <ul className="pb-1.5">
            {overdue.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                done={false}
                category={t.category_id ? catById.get(t.category_id) : undefined}
                subtitle={
                  <span className="inline-flex items-center gap-1 text-red-600/80 dark:text-red-400/80">
                    <CalendarDays className="size-3" /> {format(keyToDisplayDate(t.date!), 'd MMM')}
                  </span>
                }
                onToggle={() => toggle.mutate({ task: t, date: t.date!, done: true })}
                onEdit={() => setForm({ task: t })}
                actions={
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      className="btn-ghost px-2 py-1 text-xs"
                      title="Move to today"
                      onClick={() => update.mutate({ id: t.id, patch: { date: today, start_date: today } })}
                    >
                      Today <ArrowRight className="size-3" />
                    </button>
                    <button className="icon-btn size-8 hover:text-red-600 dark:hover:text-red-400" aria-label={`Delete "${t.title}"`} onClick={() => del.mutate(t.id)}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                }
              />
            ))}
          </ul>
        </section>
      )}

      {/* Task groups */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
          {[0, 1].map((i) => (
            <div key={i} className="card space-y-3 p-4 motion-safe:animate-pulse">
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 flex-1 rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <CalendarCheck className="size-7" />
          </div>
          <p className="font-semibold">A clear day</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">Type above to add a quick task, or set up a recurring routine.</p>
          <button className="btn-primary mt-4" onClick={() => setForm({})}>
            <Plus className="size-4" /> New task
          </button>
        </div>
      ) : (
        groups.map(({ cat, items }) => {
          const groupDone = items.filter((t) => isDone(t)).length
          return (
            <section key={cat?.id ?? 'none'} className="card overflow-hidden">
              <h3 className="section-title">
                <span className="size-2 rounded-full" style={{ background: cat?.color ?? '#94a3b8' }} />
                <span className="normal-case">{cat ? `${cat.icon} ${cat.name}` : 'No category'}</span>
                <span className={`ml-auto font-medium normal-case tabular-nums ${groupDone === items.length ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {groupDone}/{items.length}
                </span>
              </h3>
              <ul className="pb-1.5">
                {items.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    done={isDone(t)}
                    streak={t.recurrence !== 'once' ? taskStreak(t, done, today, tz) : undefined}
                    late={date === today && !!t.due_time && shortTime(t.due_time)! < nowTime}
                    onToggle={() => toggle.mutate({ task: t, date, done: !isDone(t) })}
                    onEdit={() => setForm({ task: t })}
                  />
                ))}
              </ul>
            </section>
          )
        })
      )}

      {form && (
        <TaskForm
          task={form.task}
          categories={categories}
          defaultDate={date}
          defaultCategoryId={filter !== 'all' && filter !== 'none' ? filter : undefined}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}
