import { Check, Clock, Flame, Repeat } from 'lucide-react'
import { describeRecurrence, shortTime, type Category, type Task } from '../core'

/** Priority is shown by the checkbox ring color only (red / amber / grey). */
const RING = {
  high: 'border-red-500 bg-red-50 dark:bg-red-500/10',
  medium: 'border-amber-400 bg-amber-50/60 dark:bg-amber-400/5',
  low: 'border-slate-300 dark:border-slate-600',
} as const

interface Props {
  task: Task
  done: boolean
  category?: Category
  streak?: number
  /** Due time has passed (only meaningful when viewing today). */
  late?: boolean
  subtitle?: React.ReactNode
  onToggle: () => void
  onEdit: () => void
  actions?: React.ReactNode
}

export default function TaskItem({ task, done, category, streak, late, subtitle, onToggle, onEdit, actions }: Props) {
  const time = shortTime(task.due_time)
  const repeats = task.recurrence !== 'once'
  const showStreak = !!streak && streak > 1
  const hasMeta = category || time || repeats || showStreak || subtitle

  return (
    <li className="group flex items-center gap-1 pr-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
      {/* 44px hit area around a 22px circle */}
      <button
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        title={`${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`}
        onClick={onToggle}
        className="grid size-11 shrink-0 place-items-center rounded-full pl-1 focus-visible:outline-none [&:focus-visible>span]:ring-4 [&:focus-visible>span]:ring-indigo-500/25"
      >
        <span
          className={`grid size-[22px] place-items-center rounded-full border-2 transition ${
            done ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' : `${RING[task.priority]} group-hover:border-indigo-500`
          }`}
        >
          {done && <Check className="size-3.5 motion-safe:animate-pop" strokeWidth={3.5} />}
        </span>
      </button>

      <button className="min-w-0 flex-1 py-2.5 pr-1 text-left" onClick={onEdit}>
        <div className={`truncate text-[15px] transition ${done ? 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600' : 'font-medium'}`}>
          {task.title}
        </div>
        {hasMeta && (
          <div className={`mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 ${done ? 'opacity-60' : ''}`}>
            {category && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: category.color }} />
                {category.name}
              </span>
            )}
            {time && (
              <span className={`inline-flex items-center gap-1 tabular-nums ${late && !done ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>
                <Clock className="size-3" /> {time}
              </span>
            )}
            {repeats && (
              <span className="inline-flex items-center gap-1" title={describeRecurrence(task)}>
                <Repeat className="size-3" />
                {task.recurrence === 'weekly' && describeRecurrence(task)}
              </span>
            )}
            {showStreak && (
              <span className="inline-flex items-center gap-0.5 font-medium text-orange-600 dark:text-orange-400" title={`${streak}-day streak`}>
                <Flame className="size-3" /> {streak}
              </span>
            )}
            {subtitle}
          </div>
        )}
      </button>
      {actions}
    </li>
  )
}
