import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Loader2, LogOut, Tags, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { deleteAccount } from './api/account'
import { isSupabaseConfigured, supabase } from './api/supabaseClient'
import Logo from './components/Logo'
import Modal from './components/Modal'
import { useAuth } from './hooks/auth'
import Categories from './pages/Categories'
import History from './pages/History'
import Landing from './pages/Landing'
import { Privacy, Terms } from './pages/Legal'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Today from './pages/Today'

const NAV = [
  { to: '/', label: 'Today', icon: CheckCircle2 },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/categories', label: 'Categories', icon: Tags },
]

export default function App() {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) return <Setup />
  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Logo className="size-10 motion-safe:animate-pulse" />
      </div>
    )

  return (
    <Routes>
      {/* Legal pages use the public layout whether or not you're signed in */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      {session ? (
        <Route path="*" element={<AppShell email={session.user.email ?? ''} />} />
      ) : (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  )
}

function AppShell({ email }: { email: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col pb-24 sm:pb-8">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-slate-100/80 px-4 py-3 backdrop-blur-xl dark:bg-slate-950/80">
        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Logo className="size-7" />
          Daily Checks
        </span>
        <nav className="ml-auto hidden gap-1 rounded-xl bg-slate-200/60 p-1 sm:flex dark:bg-slate-900">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              className={({ isActive }) =>
                `btn rounded-lg px-3 py-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <AccountMenu email={email} />
      </header>

      <main className="flex-1 px-4 pt-1 pb-4">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/history" element={<History />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom tab bar on phones */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200/70 bg-white/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden dark:border-slate-800 dark:bg-slate-900/85">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <n.icon className="size-6" strokeWidth={isActive ? 2.25 : 1.75} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function AccountMenu({ email }: { email: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const signOut = async () => {
    await supabase.auth.signOut()
    qc.clear()
  }

  return (
    <div ref={ref} className="relative ml-auto sm:ml-0">
      <button
        className="grid size-8 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 uppercase transition hover:ring-4 hover:ring-indigo-500/15 dark:bg-indigo-950 dark:text-indigo-300"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        aria-expanded={open}
      >
        {email[0] ?? '?'}
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-60 p-1.5 shadow-lg motion-safe:animate-fade">
          <div className="truncate px-2.5 py-2 text-xs text-slate-500" title={email}>{email}</div>
          <button className="btn-ghost w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </button>
          <button className="btn-danger w-full justify-start" onClick={() => { setOpen(false); setConfirmDelete(true) }}>
            <Trash2 className="size-4" /> Delete account
          </button>
        </div>
      )}
      {confirmDelete && <DeleteAccount email={email} onClose={() => setConfirmDelete(false)} />}
    </div>
  )
}

function DeleteAccount({ email, onClose }: { email: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      await supabase.auth.signOut({ scope: 'local' })
      qc.clear()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <Modal title="Delete account" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <p className="text-slate-600 dark:text-slate-300">
          This permanently deletes <span className="font-medium text-slate-900 dark:text-white">{email}</span> with all categories, tasks and history. It can't be undone.
        </p>
        <div>
          <label className="label" htmlFor="confirm-delete">Type DELETE to confirm</label>
          <input id="confirm-delete" className="input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn bg-red-600 text-white hover:bg-red-500" disabled={typed !== 'DELETE' || busy} onClick={run}>
            {busy && <Loader2 className="size-4 animate-spin" />} Delete forever
          </button>
        </div>
      </div>
    </Modal>
  )
}
