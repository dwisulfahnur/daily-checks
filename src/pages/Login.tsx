import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { supabase } from '../api/supabaseClient'
import Logo from '../components/Logo'

/**
 * Email sign-in: Supabase sends a magic link AND a 6-digit code.
 * The code path matters for the installed PWA on iOS, where the emailed
 * link opens Safari (separate storage) instead of the home-screen app.
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/15" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4 size-14 drop-shadow-lg" />
          <h1 className="text-2xl font-bold tracking-tight">Daily Checks</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your home, office & project checklist, synced everywhere.</p>
        </div>
        <div className="card p-6 shadow-xl shadow-slate-900/5">
          {step === 'email' ? (
            <form onSubmit={sendEmail} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <input id="email" type="email" required autoFocus autoComplete="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button className="btn-primary w-full py-2.5" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? 'Sending…' : 'Continue with email'}
                {!busy && <ArrowRight className="size-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <MailCheck className="size-5" />
                </div>
                <p className="font-semibold">Check your inbox</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  We sent a link and a code to <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                </p>
              </div>
              <input
                aria-label="Sign-in code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                maxLength={10}
                className="input py-3 text-center font-mono text-xl tracking-[0.5em]"
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button className="btn-primary w-full py-2.5" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {busy ? 'Checking…' : 'Sign in'}
              </button>
              <button type="button" className="btn-ghost w-full text-xs" onClick={() => { setStep('email'); setCode(''); setError(null) }}>
                <ArrowLeft className="size-3.5" /> Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
