import { Archive, Flag, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { WEEKDAY_LABELS, shortTime, type Category, type DateKey, type Priority, type Task } from '../core'
import { useDeleteTask, useSaveTask, useUpdateTask } from '../hooks/data'
import Modal from './Modal'

type Repeat = 'once' | 'daily' | 'weekly'

const PRIORITY_COLOR = { high: 'text-red-500', medium: 'text-amber-400', low: 'text-slate-300 dark:text-slate-600' } as const

interface Props {
  task?: Task
  categories: Category[]
  defaultDate: DateKey
  defaultCategoryId?: string | null
  onClose: () => void
}

export default function TaskForm({ task, categories, defaultDate, defaultCategoryId, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [categoryId, setCategoryId] = useState(task?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueTime, setDueTime] = useState(shortTime(task?.due_time ?? null) ?? '')
  const [repeat, setRepeat] = useState<Repeat>(task?.recurrence ?? 'once')
  const [days, setDays] = useState<number[]>(task?.days_of_week.length ? task.days_of_week : [1, 2, 3, 4, 5])
  const [date, setDate] = useState(task?.date ?? defaultDate)
  const [error, setError] = useState<string | null>(null)

  const save = useSaveTask()
  const update = useUpdateTask()
  const del = useDeleteTask()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (repeat === 'weekly' && days.length === 0) return setError('Pick at least one day.')
    try {
      await save.mutateAsync({
        id: task?.id,
        input: {
          title: title.trim(),
          notes: notes.trim() || null,
          category_id: categoryId || null,
          priority,
          due_time: dueTime || null,
          recurrence: repeat,
          days_of_week: repeat === 'weekly' ? [...days].sort() : [],
          date: repeat === 'once' ? date : null,
          start_date: repeat === 'once' ? date : (task?.start_date ?? defaultDate),
        },
      })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const archive = async () => {
    await update.mutateAsync({ id: task!.id, patch: { archived_at: new Date().toISOString() } })
    onClose()
  }

  const remove = async () => {
    if (!confirm(`Delete "${task!.title}" and all its history? Use Archive to keep history.`)) return
    await del.mutateAsync(task!.id)
    onClose()
  }

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
  const seg = (active: boolean) => (active ? 'seg-on' : 'seg-off')
  const cats = categories.filter((c) => !c.archived_at || c.id === task?.category_id)

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <input
          id="title"
          aria-label="Title"
          className="w-full border-0 border-b border-slate-200 bg-transparent pb-2 text-lg font-medium outline-none placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700"
          placeholder="What needs doing?"
          required
          autoFocus
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <span className="label">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: '', name: 'None', icon: '', color: '#94a3b8' }, ...cats].map((c) => {
              const on = categoryId === c.id
              return (
                <button
                  type="button"
                  key={c.id || 'none'}
                  aria-pressed={on}
                  onClick={() => setCategoryId(c.id)}
                  className={`btn rounded-full px-3 py-1.5 text-[13px] ring-1 ${
                    on
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-500 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-slate-600 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="size-2 rounded-full" style={{ background: c.color }} />
                  {c.icon} {c.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <span className="label">Priority</span>
            <div className="segmented">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button type="button" key={p} aria-pressed={priority === p} className={`${seg(priority === p)} capitalize`} onClick={() => setPriority(p)}>
                  <Flag className={`size-3.5 ${PRIORITY_COLOR[p]}`} fill="currentColor" />
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="time">Due time</label>
            <input id="time" type="time" className="input h-[42px] py-0" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </div>

        <div>
          <span className="label">Repeat</span>
          <div className="segmented">
            <button type="button" aria-pressed={repeat === 'once'} className={seg(repeat === 'once')} onClick={() => setRepeat('once')}>Once</button>
            <button type="button" aria-pressed={repeat === 'daily'} className={seg(repeat === 'daily')} onClick={() => setRepeat('daily')}>Every day</button>
            <button type="button" aria-pressed={repeat === 'weekly'} className={seg(repeat === 'weekly')} onClick={() => setRepeat('weekly')}>Some days</button>
          </div>
          {repeat === 'once' && (
            <input type="date" required className="input mt-2" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          )}
          {repeat === 'weekly' && (
            <div className="mt-2 flex justify-between gap-1">
              {WEEKDAY_LABELS.map((l, i) => (
                <button
                  type="button"
                  key={l}
                  aria-pressed={days.includes(i)}
                  aria-label={l}
                  className={`btn size-10 rounded-full p-0 text-xs ${
                    days.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  onClick={() => toggleDay(i)}
                >
                  {l.slice(0, 2)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" rows={2} maxLength={2000} className="input resize-none" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-1 pt-1">
          {task && (
            <>
              <button type="button" className="icon-btn hover:text-red-600 dark:hover:text-red-400" onClick={remove} aria-label="Delete task" title="Delete task and its history">
                <Trash2 className="size-[18px]" />
              </button>
              {task.recurrence !== 'once' && (
                <button type="button" className="icon-btn" onClick={archive} aria-label="Archive routine" title="Stop showing from today, keep history">
                  <Archive className="size-[18px]" />
                </button>
              )}
            </>
          )}
          <span className="flex-1" />
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary min-w-20" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}
