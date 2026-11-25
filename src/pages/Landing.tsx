import { ArrowRight, CalendarDays, Flag, Flame, Heart, ListChecks, Mail, Repeat, Smartphone, Tags } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import PublicLayout from '../components/PublicLayout'
import ProgressRing from '../components/ProgressRing'
import TaskItem from '../components/TaskItem'
import type { Category, Task } from '../core'

const FEATURES = [
  { icon: Repeat, title: 'Routines that reset', text: 'Daily or chosen-weekday tasks start fresh every morning. No cleanup needed.' },
  { icon: Tags, title: 'Your categories', text: 'Home, office, side projects, or anything else. Name them and pick a color.' },
  { icon: Flag, title: 'Priority & due time', text: 'Important things stay on top, and late ones stand out.' },
  { icon: ListChecks, title: 'One-off tasks too', text: 'Missed something yesterday? It waits in an overdue list until you deal with it.' },
  { icon: Flame, title: 'Streaks & history', text: 'A heatmap of every day and streaks for each routine keep you going.' },
  { icon: Smartphone, title: 'Every device', text: 'Synced between phone and computer. Install it on your home screen like an app.' },
]

// ── Static demo data for the interactive preview ─────────────────────────────
const cat = (id: string, name: string, color: string): Category => ({
  id, name, color, user_id: '', icon: '•', sort_order: 0, archived_at: null, created_at: '',
})
const CATS = { home: cat('home', 'Home', '#10b981'), office: cat('office', 'Office', '#6366f1'), project: cat('project', 'Side project', '#f59e0b') }

const task = (id: string, title: string, category: keyof typeof CATS, extra: Partial<Task> = {}): Task & { cat: Category } => ({
  id, title, category_id: category, cat: CATS[category], user_id: '', notes: null, priority: 'medium', due_time: null,
  recurrence: 'daily', days_of_week: [], date: null, start_date: '', archived_at: null, sort_order: 0, created_at: '', ...extra,
})
const DEMO = [
  task('1', 'Water the plants', 'home', { due_time: '08:00', priority: 'low' }),
  task('2', 'Review pull requests', 'office', { priority: 'high', recurrence: 'weekly', days_of_week: [1, 2, 3, 4, 5] }),
  task('3', 'Send weekly report', 'office', { recurrence: 'once', due_time: '16:00', priority: 'high' }),
  task('4', 'Write for 30 minutes', 'project'),
  task('5', 'Evening walk', 'home', { priority: 'low' }),
]
const STREAKS: Record<string, number> = { '1': 12, '4': 5 }

function Demo() {
  const [done, setDone] = useState<Set<string>>(() => new Set(['1', '2']))
  const toggle = (id: string) =>
    setDone((s) => {
      const next = new Set(s)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const pct = done.size / DEMO.length

  return (
    <div className="card overflow-hidden shadow-xl shadow-slate-900/5">
      <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold tracking-tight">Today</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {done.size} of {DEMO.length} done
          </div>
        </div>
        <ProgressRing value={pct} size={52} stroke={5}>
          <span className="text-xs font-semibold tabular-nums">{Math.round(pct * 100)}%</span>
        </ProgressRing>
      </div>
      <ul className="divide-y divide-slate-100 py-1 dark:divide-slate-800/70">
        {DEMO.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            category={t.cat}
            done={done.has(t.id)}
            streak={STREAKS[t.id]}
            onToggle={() => toggle(t.id)}
            onEdit={() => toggle(t.id)}
          />
        ))}
      </ul>
      <p className="border-t border-slate-100 px-4 py-2.5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Try it: tap a task to check it off
      </p>
    </div>
  )
}

export default function Landing() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/15" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Heart className="size-3.5" /> Free, no ads
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Your daily checklist for <span className="text-indigo-600 dark:text-indigo-400">home, work & everything else</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-slate-600 lg:mx-0 dark:text-slate-300">
              Set up your routines once. Every morning they're ready to check off again, and your history shows how consistent you've been.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/login" className="btn-primary px-5 py-3 text-base">
                Get started free <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-slate-500 dark:text-slate-400">Sign in with your email. No password.</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">
            <Demo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Everything a daily list needs</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600 dark:text-slate-300">And nothing it doesn't. No teams, no boards, no setup wizard.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Up and running in a minute</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { icon: Mail, title: 'Sign in with email', text: "We email you a code. There's no password to remember." },
            { icon: ListChecks, title: 'Add your routines', text: 'Daily, weekdays only, or just once. Group them by category.' },
            { icon: CalendarDays, title: 'Check them off', text: 'Tomorrow they reset. Your history and streaks build up.' },
          ].map((s, i) => (
            <li key={s.title} className="text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">{i + 1}</div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pt-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-12 text-center text-white shadow-xl shadow-indigo-600/20">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">Start tomorrow with a clear list</h2>
          <p className="relative mx-auto mt-3 max-w-md text-indigo-100">Free to use. Your data stays private to your account, and you can delete it any time.</p>
          <Link to="/login" className="btn relative mt-7 bg-white px-5 py-3 text-base text-indigo-700 shadow-sm hover:bg-indigo-50">
            Create your list <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
