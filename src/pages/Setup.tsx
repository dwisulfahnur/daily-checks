import { Settings2 } from 'lucide-react'
import Logo from '../components/Logo'

export default function Setup() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="mb-6 flex items-center gap-3">
        <Logo className="size-10" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Daily Checks</h1>
          <p className="text-sm text-slate-500">Setup needed</p>
        </div>
      </div>
      <div className="card space-y-3 p-5 text-sm leading-relaxed">
        <p className="flex items-center gap-2 font-medium">
          <Settings2 className="size-4 text-indigo-600" /> Supabase isn't configured yet.
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-slate-600 dark:text-slate-300">
          <li>Create a free project at supabase.com.</li>
          <li>
            Run the files in <code>supabase/migrations/</code> in order in the SQL Editor.
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env</code> and fill in the project URL and anon key.
          </li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
      </div>
    </div>
  )
}
