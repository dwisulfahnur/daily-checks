import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/auth'
import Logo from './Logo'

/** Header + footer for the signed-out pages (landing, privacy, terms). */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-slate-100/80 backdrop-blur-xl dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Logo className="size-7" />
            Daily Checks
          </Link>
          {session ? (
            <Link to="/" className="btn-primary ml-auto">Open app</Link>
          ) : (
            <Link to="/login" className="btn-ghost ml-auto">Sign in</Link>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200/70 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <Logo className="size-5" /> Daily Checks
          </span>
          <nav className="flex gap-4 sm:ml-auto">
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
