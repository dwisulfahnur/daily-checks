import { ArchiveRestore, ChevronDown, ChevronUp, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Category } from '../core'
import { useCategories, useSaveCategory, useTasks } from '../hooks/data'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']
const ICONS = ['🏠', '💼', '🚀', '📚', '💪', '🛒', '💰', '🧘', '🎨', '👨‍👩‍👧', '🌱', '📋']

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories()
  const { data: tasks = [] } = useTasks()
  const save = useSaveCategory()
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const active = categories.filter((c) => !c.archived_at)
  const archived = categories.filter((c) => c.archived_at)
  const countFor = (id: string) => tasks.filter((t) => t.category_id === id && !t.archived_at).length

  const move = async (idx: number, dir: -1 | 1) => {
    const other = active[idx + dir]
    if (!other) return
    const me = active[idx]
    // Re-number all so ordering is stable even when sort_order values collide.
    const reordered = [...active]
    reordered[idx] = other
    reordered[idx + dir] = me
    await Promise.all(reordered.map((c, i) => (c.sort_order === i ? null : save.mutateAsync({ id: c.id, input: { sort_order: i } }))))
  }

  if (isLoading) return <div className="card h-64 motion-safe:animate-pulse" aria-busy="true" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        {editing !== 'new' && (
          <button className="btn-primary" onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Add
          </button>
        )}
      </div>

      {editing === 'new' && <CategoryEditor nextOrder={active.length} onDone={() => setEditing(null)} />}

      <ul className="card overflow-hidden py-1.5">
        {active.map((c, i) =>
          editing === c.id ? (
            <li key={c.id} className="p-4"><CategoryEditor category={c} onDone={() => setEditing(null)} /></li>
          ) : (
            <li key={c.id} className="group flex items-center gap-3 px-3 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="grid size-10 place-items-center rounded-xl text-lg" style={{ background: c.color + '22', boxShadow: `inset 0 0 0 1px ${c.color}33` }}>
                {c.icon}
              </span>
              <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(c.id)}>
                <div className="truncate text-[15px] font-medium">{c.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {countFor(c.id)} active {countFor(c.id) === 1 ? 'task' : 'tasks'}
                </div>
              </button>
              <div className="flex items-center">
                <button className="icon-btn size-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${c.name} up`}><ChevronUp className="size-4" /></button>
                <button className="icon-btn size-8" disabled={i === active.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${c.name} down`}><ChevronDown className="size-4" /></button>
                <button className="icon-btn size-8" onClick={() => setEditing(c.id)} aria-label={`Edit ${c.name}`}><Pencil className="size-4" /></button>
              </div>
            </li>
          ),
        )}
        {active.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No categories yet.</li>}
      </ul>

      {archived.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Archived</h2>
          <ul className="card overflow-hidden py-1.5">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-1.5 text-sm text-slate-500">
                <span className="opacity-60 grayscale">{c.icon}</span>
                <span className="flex-1">{c.name}</span>
                <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => save.mutate({ id: c.id, input: { archived_at: null } })}>
                  <ArchiveRestore className="size-3.5" /> Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CategoryEditor({ category, nextOrder = 0, onDone }: { category?: Category; nextOrder?: number; onDone: () => void }) {
  const save = useSaveCategory()
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? ICONS[0])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await save.mutateAsync({ id: category?.id, input: category ? { name: name.trim(), color, icon } : { name: name.trim(), color, icon, sort_order: nextOrder } })
    onDone()
  }

  const archive = async () => {
    await save.mutateAsync({ id: category!.id, input: { archived_at: new Date().toISOString() } })
    onDone()
  }

  return (
    <form onSubmit={submit} className={category ? 'space-y-4' : 'card space-y-4 p-4 motion-safe:animate-fade'}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: color + '22' }}>{icon}</span>
        <input className="input" required autoFocus maxLength={60} placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ICONS.map((i) => (
          <button type="button" key={i} onClick={() => setIcon(i)} aria-label={`Icon ${i}`} aria-pressed={icon === i} className={`grid size-10 place-items-center rounded-xl text-lg transition ${icon === i ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-950' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>{i}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {COLORS.map((c) => (
          <button type="button" key={c} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className={`size-8 rounded-full transition hover:scale-110 ${color === c ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900' : ''}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex gap-2">
        {category && <button type="button" className="btn-danger" onClick={archive}>Archive</button>}
        <span className="flex-1" />
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn-primary" disabled={save.isPending}>Save</button>
      </div>
    </form>
  )
}
