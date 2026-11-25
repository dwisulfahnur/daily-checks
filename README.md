# ☑️ Daily Checks

A personal daily checklist for home, office and personal projects — synced across devices.

**Features:** custom categories · recurring routines (every day / chosen weekdays) that reset automatically · one-off tasks with an overdue list · priority & due time · history heatmap & streaks · installable on your phone (PWA).

**Stack:** React + Vite + TypeScript, Tailwind CSS, TanStack Query, Supabase (Postgres + Auth + RLS).

## Setup

### 1. Supabase project
1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor:** run the files in [`supabase/migrations/`](supabase/migrations/) in order (`0001_init.sql`, then `0002_hardening.sql`).
   (Or with the CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.)
3. **Authentication → URL Configuration:** set *Site URL* to `http://localhost:5173`. Add your deployed URL to *Redirect URLs* later (exact URLs, no broad wildcards).
4. **Lock it down:** once you've signed in on your devices, turn off *Authentication → Sign In / Providers → Allow new users to sign up*, and set the email OTP expiry to ~15 minutes.

### 2. Sign-in email (Resend SMTP)
Supabase's built-in email sender is only for testing and is heavily rate-limited, so sign-in emails go through [Resend](https://resend.com).

1. **Resend → Domains:** add and verify your sending domain (DKIM + `send.` MX/SPF records).
2. **Resend → API Keys:** create a key with *Sending access*.
3. **Supabase → Authentication → Emails → SMTP Settings:** enable custom SMTP:

   | Field | Value |
   |---|---|
   | Sender email | an address on the verified domain, e.g. `noreply@daily-checks.app` |
   | Sender name | `Daily Checks` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key (`re_…`) |

4. **Authentication → Email Templates → Magic Link:** include the one-time code, e.g.
   ```html
   <h2>Sign in to Daily Checks</h2>
   <p>Your code: <strong>{{ .Token }}</strong></p>
   <p>Or <a href="{{ .ConfirmationURL }}">click here to sign in</a>.</p>
   ```
   The code lets you sign in on a phone or in the installed app on iPhone, where the email link opens Safari instead of the app.

If sign-in shows **"Error sending confirmation email"**, check **Supabase → Logs → Auth Logs** for the SMTP error. The usual causes: a sender address that isn't on the verified domain, a username other than `resend`, or a wrong API key.

### 3. Run the app
```bash
cp .env.example .env   # then fill in the values below
npm install
npm run dev            # http://localhost:5173
```

`.env` (git-ignored):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co   # Project Settings → API
VITE_SUPABASE_ANON_KEY=<publishable / anon key>       # never the service_role / secret key
```

Only variables prefixed with `VITE_` are sent to the browser. Keep any other secrets, like the Resend key, unprefixed.

Sign in with your email: click the link or enter the code. New accounts get three starter categories: Home, Office, Personal Project.

To try it on your phone over the same Wi-Fi, run `npm run dev -- --host` and open the printed network URL. Sign in with the code, since the email link points to the *Site URL*.

### Optional: local Supabase
For offline development with Docker: `npx supabase start` applies the migration to a local stack, and `npx supabase stop` stops it. Put the printed local URL and anon key in `.env.local`, which overrides `.env` (delete it to go back to the cloud). Local emails don't need SMTP; they are captured at http://127.0.0.1:54324.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests for scheduling & streak logic |
| `npm run build` | Type-check + production build |
| `npm run lint` | oxlint |

## How it works

- A task is *done for day D* if a row exists in `task_completions` for `(task, D)`. A new day has no rows, so recurring tasks reset by themselves — no cron job — and every past day stays in history.
- Days are calculated in your timezone (taken from your browser on first sign-in and stored in `profiles`).
- **Archive** a routine to stop it from today on while keeping its history; **Delete** removes it and its history.
- Row Level Security makes every row visible only to its owner.
- Known limitation: editing a routine's schedule (e.g. daily → weekdays) also changes how past days are counted in history/streaks.

## Project layout

```
src/core/    Pure TypeScript domain logic (types, dates, scheduling, streaks) + tests
src/api/     Supabase data access
src/hooks/   Auth context + React Query hooks (optimistic check/uncheck)
src/pages/   Today, History, Categories, Login
src/components/
```

`src/core` and `src/api` have no DOM/React dependencies so they can be shared with a future React Native (Expo) app.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages): build command `npm run build`, output `dist`, set the two `VITE_SUPABASE_*` env vars, and the SPA fallback + security headers (CSP, `X-Frame-Options`, …) come preconfigured: `vercel.json` for Vercel, `public/_headers` + `public/_redirects` for Netlify / Cloudflare Pages. Then in Supabase, set *Site URL* to the deployed URL (keep `http://localhost:5173` in *Redirect URLs* for local dev).
