-- Daily Checks: security hardening
-- Apply with `supabase db push`, or paste into Supabase Dashboard → SQL Editor.

-- ── Bound user-supplied values (stops oversized / malformed rows) ──────────
alter table public.categories
  add constraint categories_color_hex check (color ~ '^#[0-9a-fA-F]{6}$'),
  add constraint categories_icon_len  check (char_length(icon) between 1 and 16);

alter table public.tasks
  add constraint tasks_notes_len  check (notes is null or char_length(notes) <= 2000),
  add constraint tasks_days_valid check (days_of_week <@ '{0,1,2,3,4,5,6}'::smallint[]);

alter table public.profiles
  add constraint profiles_timezone_format check (
    char_length(timezone) between 1 and 64 and timezone ~ '^[A-Za-z0-9_+/-]+$');

-- ── Anonymous visitors get no table access at all (RLS was already hiding rows)
revoke all on public.profiles, public.categories, public.tasks, public.task_completions from anon;

-- ── The signup trigger function is internal; nobody needs to call it ───────
revoke execute on function public.handle_new_user() from public, anon, authenticated;
