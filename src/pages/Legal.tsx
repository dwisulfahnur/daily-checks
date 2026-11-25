import type { ReactNode } from 'react'
import PublicLayout from '../components/PublicLayout'

/** Optional contact address shown on the legal pages (set VITE_CONTACT_EMAIL at build time). */
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
const UPDATED = 'November 25, 2026'

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-2xl px-4 py-12 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500">Last updated {UPDATED}</p>
        {children}
        {CONTACT && (
          <>
            <h2>Contact</h2>
            <p>
              Questions? Email <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </p>
          </>
        )}
      </article>
    </PublicLayout>
  )
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <p>Daily Checks is a free checklist app. This page explains what it stores and why.</p>

      <h2>What we store</h2>
      <ul>
        <li><strong>Your email address</strong>, to sign you in.</li>
        <li><strong>What you enter</strong>: categories, tasks, notes, and which days you checked them off.</li>
        <li><strong>Your timezone</strong>, so days start at your midnight.</li>
      </ul>
      <p>There are no ads, no analytics and no tracking cookies. Your browser keeps a sign-in session in local storage so you stay signed in.</p>

      <h2>Who can see it</h2>
      <p>Only you. Every row is locked to your account in the database. We don't sell or share your data.</p>

      <h2>Services we use</h2>
      <ul>
        <li><strong>Supabase</strong> hosts the database and handles sign-in.</li>
        <li><strong>Resend</strong> delivers sign-in emails.</li>
        <li><strong>Cloudflare</strong> serves the website.</li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        Open the account menu (your initial in the top-right corner) and choose <strong>Delete account</strong>. This permanently removes your account and everything in it.
      </p>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="Terms of Use">
      <p>By using Daily Checks you agree to these terms.</p>

      <h2>The service</h2>
      <p>Daily Checks is offered free of charge, as is, without any warranty. It may change, have downtime, or be discontinued. Keep anything critical somewhere else as well.</p>

      <h2>Your account</h2>
      <ul>
        <li>You're responsible for access to your email inbox, since that's how you sign in.</li>
        <li>Don't use the service to store unlawful content or to abuse it, for example by automated sign-ups or sending sign-in emails to addresses that aren't yours.</li>
        <li>Accounts that abuse the service may be removed.</li>
      </ul>

      <h2>Your content</h2>
      <p>What you write stays yours. You can delete your account and all its data at any time from the account menu.</p>

      <h2>Liability</h2>
      <p>To the extent the law allows, we're not liable for any loss arising from use of the service, including lost data or missed tasks.</p>
    </Page>
  )
}
